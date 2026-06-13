import type { NextAuthConfig } from "next-auth";

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

export const authConfig = {
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/onboarding",
    error: "/auth/login",
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
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

      const publicPaths = [
        "/",
        "/auth",
        "/api/auth",
        "/api/visitor",
        "/api/analytics/event",
        "/api/public",
        "/api/billing/bayar-gg/callback",
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

      const protectedPrefixes = ["/dashboard", "/admin", "/onboarding", "/api/"];
      const isProtected = protectedPrefixes.some((prefix) =>
        pathname.startsWith(prefix)
      );

      if (!isProtected) return true;

      return !!authSession?.user;
    },
  },
  trustHost:
    process.env.AUTH_TRUST_HOST === undefined
      ? true
      : process.env.AUTH_TRUST_HOST === "true",
} satisfies NextAuthConfig;
