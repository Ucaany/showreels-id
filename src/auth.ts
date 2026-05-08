import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { verifyPassword } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db!, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/onboarding",
    error: "/auth/login",
  },
  providers: [
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

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
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
  trustHost: true,
});
