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
import { verifyPassword } from "@/lib/password";
import { ensureUniqueUsername } from "@/lib/username";

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
    strategy: "database",
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
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user?.passwordHash) {
          return null;
        }

        const passwordMatches = await verifyPassword(
          parsed.data.password,
          user.passwordHash
        );

        if (!passwordMatches) {
          return null;
        }

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
    async session({ session, user }) {
      if (session.user) {
        session.user.id = String(user.id ?? "");
        const sessionUser = await db.query.users.findFirst({
          where: eq(users.id, String(user.id ?? "")),
          columns: {
            username: true,
          },
        });
        session.user.username = sessionUser?.username ?? null;
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
