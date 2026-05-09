import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { verifyPassword } from "@/lib/password";

const CANONICAL_ORIGIN = "https://showreels.id";
const ALLOWED_REDIRECT_ORIGINS = new Set([
  "https://showreels.id",
  "https://www.showreels.id",
]);

function resolveAppOrigin(baseUrl: string) {
  try {
    const origin = new URL(baseUrl).origin;

    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return origin;
    }

    if (ALLOWED_REDIRECT_ORIGINS.has(origin)) {
      return origin;
    }

    return CANONICAL_ORIGIN;
  } catch {
    return CANONICAL_ORIGIN;
  }
}

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
  adapter,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/onboarding",
    error: "/auth/login",
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    // Google OAuth provider - optional, aktif jika env tersedia
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
    // Credentials (email/password)
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        if (!db) return null;

        // Select hanya kolom yang diperlukan untuk performa
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

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      const appOrigin = resolveAppOrigin(baseUrl);

      if (url.startsWith("/")) {
        return `${appOrigin}${url}`;
      }

      try {
        const targetUrl = new URL(url);

        if (ALLOWED_REDIRECT_ORIGINS.has(targetUrl.origin)) {
          return `${appOrigin}${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
        }
      } catch {
        // no-op
      }

      return `${appOrigin}/dashboard`;
    },
    async authorized({ auth: authSession, request }) {
      const { pathname } = request.nextUrl;

      // Public routes - always accessible
      const publicPaths = [
        "/",
        "/auth",
        "/api/auth",
        "/api/visitor",
        "/api/analytics/event",
        "/api/public",
        "/api/billing/tripay/callback",
        "/api/billing/midtrans/webhook",
        "/api/cron",
        "/api/site-status",
        "/about",
        "/pricing",
        "/legal",
        "/customer-service",
        "/videos",
        "/v/",
        "/creator/",
      ];

      const isPublic = publicPaths.some((path) => pathname.startsWith(path));
      if (isPublic) return true;

      // Slug pages (public profiles) - /[slug] but not /dashboard, /admin, etc.
      const protectedPrefixes = ["/dashboard", "/admin", "/onboarding", "/api/"];
      const isProtected = protectedPrefixes.some((prefix) =>
        pathname.startsWith(prefix)
      );

      if (!isProtected) return true; // Public slug pages

      // Protected routes require authentication
      return !!authSession?.user;
    },
  },
  trustHost:
    process.env.AUTH_TRUST_HOST === undefined
      ? true
      : process.env.AUTH_TRUST_HOST === "true",
});
