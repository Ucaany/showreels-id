import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig } from "@/auth.config";
import { db, isDatabaseConfigured } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";

function getGoogleCredentials() {
  const clientId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret };
}

const googleCredentials = getGoogleCredentials();

const adapter =
  isDatabaseConfigured && db
    ? DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      })
    : undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter,
  providers: [
    Credentials({
      name: "Email dan Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password || !db) {
          return null;
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
          columns: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const { verifyPassword } = await import("@/lib/password");
        const isValidPassword = await verifyPassword(password, user.passwordHash);

        if (!isValidPassword) {
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
    ...(googleCredentials
      ? [
          Google({
            clientId: googleCredentials.clientId,
            clientSecret: googleCredentials.clientSecret,
            allowDangerousEmailAccountLinking: true,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),
  ],
  events: {
    async createUser({ user }) {
      if (!user.id || !user.email) return;

      try {
        console.log(`[Auth] User baru dibuat: ${user.email}`);

        const { syncUserProfile } = await import("@/server/auth-profile");
        const { getOrCreateSubscription } = await import("@/server/billing");
        const { queueEmail } = await import("@/lib/email");

        const profile = await syncUserProfile({
          id: user.id,
          email: user.email,
          user_metadata: {
            full_name: user.name ?? undefined,
            avatar_url: user.image ?? undefined,
          },
        });

        await getOrCreateSubscription(user.id);

        if (profile.role !== "owner" && profile.email) {
          const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://showreels.id";
          const trialExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          const trialExpiresFormatted = trialExpiresAt.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });

          void queueEmail({
            userId: user.id,
            recipientEmail: profile.email,
            template: {
              type: "welcome",
              data: {
                userName: profile.name || "Creator",
                dashboardUrl: `${appOrigin}/dashboard`,
              },
            },
          });

          void queueEmail({
            userId: user.id,
            recipientEmail: profile.email,
            template: {
              type: "subscription_activated",
              data: {
                userName: profile.name || "Creator",
                planName: "Creator",
                expiresAt: trialExpiresFormatted,
                dashboardUrl: `${appOrigin}/dashboard`,
              },
            },
          });
        }

        console.log(
          `[Auth] User ${user.email} setup selesai: role=${profile.role}, username=${profile.username}`
        );
      } catch (error) {
        console.error(`[Auth] Error handling new user ${user.email}:`, error);
      }
    },
  },
});
