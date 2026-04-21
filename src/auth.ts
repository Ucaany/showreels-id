import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/db/schema";
import { signInSchema } from "@/lib/auth-schemas";
import { ensureUniqueUsername } from "@/lib/username";
import {
  getRemainingLockMinutes,
  getUserByEmail,
  resetLoginAttempts,
} from "@/server/auth-security";
import { verifyPassword } from "@/lib/password";

const googleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    ...(googleConfigured
      ? [
          Google({
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = await signInSchema.safeParseAsync(credentials);
        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.trim().toLowerCase();
        const user = await getUserByEmail(email);

        if (!user?.passwordHash) {
          return null;
        }

        if (user.loginLockedUntil && user.loginLockedUntil.getTime() > Date.now()) {
          throw new Error(
            `Terlalu banyak percobaan login. Coba lagi dalam ${getRemainingLockMinutes(
              user.loginLockedUntil
            )} menit.`
          );
        }

        const passwordMatches = await verifyPassword(
          parsed.data.password,
          user.passwordHash
        );

        if (!passwordMatches) {
          return null;
        }

        await resetLoginAttempts(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const userId = String(user?.id ?? token.sub ?? "");
      if (!userId) {
        return token;
      }

      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          email: true,
          name: true,
          image: true,
          username: true,
        },
      });

      if (!currentUser) {
        return token;
      }

      token.sub = currentUser.id;
      token.email = currentUser.email;
      token.name = currentUser.name;
      token.picture = currentUser.image;
      token.username = currentUser.username ?? null;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.sub ?? "");
        session.user.username =
          typeof token.username === "string" ? token.username : null;
        session.user.email = token.email ?? session.user.email ?? "";
        session.user.name =
          typeof token.name === "string" ? token.name : session.user.name;
        session.user.image =
          typeof token.picture === "string" ? token.picture : session.user.image;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (!user.email) {
        return false;
      }

      if (account?.provider === "google") {
        const currentUser = await db.query.users.findFirst({
          where: eq(users.id, user.id as string),
        });

        if (currentUser && !currentUser.username) {
          const baseName =
            currentUser.email.split("@")[0] || currentUser.name || "creator";
          const username = await ensureUniqueUsername(baseName);
          await db
            .update(users)
            .set({
              username,
              name: currentUser.name || user.name || baseName,
              image: currentUser.image || user.image || null,
              updatedAt: new Date(),
            })
            .where(eq(users.id, currentUser.id));
        }
      }

      return true;
    },
  },
});
