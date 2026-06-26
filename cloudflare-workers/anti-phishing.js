const CANONICAL_HOSTS = ["showreels.id", "www.showreels.id"];

const BAD_BOTS = [
  "ahrefsbot", "semrushbot", "dotbot", "mj12bot", "blexbot",
  "petalbot", "bytespider", "gptbot", "ccbot", "claudebot",
  "anthropic-ai", "cohere-ai", "scrapy", "python-requests",
  "curl/", "wget/", "libwww-perl", "go-http-client",
  "zgrab", "masscan", "nikto", "nmap", "sqlmap", "dirbuster",
  "nuclei", "hydra", "metasploit", "burpsuite", "w3af",
  "havij", "acunetix", "nessus", "openvas",
];

const PHISHING_UA_PATTERNS = [
  "phish", "harvest", "httrack", "teleport", "webzip", "offline",
  "clone", "copier",
];

const SENSITIVE_PATHS = [
  "/auth/login",
  "/api/auth",
  "/dashboard",
  "/admin",
  "/onboarding",
  "/billing",
  "/payment",
];

const RATE_LIMIT_WINDOW = 60;
const RATE_LIMIT_MAX = 120;
const LOGIN_RATE_LIMIT_MAX = 5;

function isBadBot(ua) {
  const lower = ua.toLowerCase();
  return BAD_BOTS.some((bot) => lower.includes(bot));
}

function isPhishingUA(ua) {
  const lower = ua.toLowerCase();
  return PHISHING_UA_PATTERNS.some((p) => lower.includes(p));
}

function isHostSpoofing(host) {
  const normalizedHost = (host || "").split(":")[0].toLowerCase();
  return !CANONICAL_HOSTS.includes(normalizedHost);
}

function isSuspiciousReferer(referer) {
  if (!referer) return false;
  try {
    const refHost = new URL(referer).hostname.toLowerCase();
    return (
      refHost.includes("showreels") &&
      !CANONICAL_HOSTS.includes(refHost)
    );
  } catch {
    return false;
  }
}

function isSensitivePath(pathname) {
  return SENSITIVE_PATHS.some((p) => pathname.startsWith(p));
}

async function checkRateLimit(env, key, max) {
  if (!env.RATE_LIMITER) return false;
  const { success } = await env.RATE_LIMITER.limit({ key });
  return !success;
}

function blockResponse(reason, status = 403) {
  return new Response(reason, {
    status,
    headers: {
      "Content-Type": "text/plain",
      "X-Block-Reason": reason,
    },
  });
}

function addSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
  headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const ua = request.headers.get("user-agent") || "";
    const host = request.headers.get("host") || "";
    const referer = request.headers.get("referer") || "";
    const clientIp = request.headers.get("cf-connecting-ip") || "unknown";
    const pathname = url.pathname;

    if (isHostSpoofing(host)) {
      return blockResponse("Bad Request", 400);
    }

    if (isSuspiciousReferer(referer)) {
      return blockResponse("Forbidden: suspicious referer");
    }

    if (isBadBot(ua)) {
      return blockResponse("Forbidden: bad bot");
    }

    if (isPhishingUA(ua)) {
      return blockResponse("Forbidden: suspicious client");
    }

    const isLogin = pathname === "/auth/login" && request.method === "POST";
    if (isLogin) {
      const limited = await checkRateLimit(env, `login:${clientIp}`, LOGIN_RATE_LIMIT_MAX);
      if (limited) {
        return blockResponse("Too Many Requests", 429);
      }
    }

    if (isSensitivePath(pathname)) {
      const limited = await checkRateLimit(env, `sensitive:${clientIp}`, RATE_LIMIT_MAX);
      if (limited) {
        return new Response("Too Many Requests", {
          status: 429,
          headers: { "Retry-After": "60" },
        });
      }
    }

    const vercelOrigin = env.VERCEL_ORIGIN || "showreels-9sd1in3b5-ucaanys-projects.vercel.app";
    const originUrl = new URL(request.url);
    originUrl.hostname = vercelOrigin;
    originUrl.port = "";
    const originHeaders = new Headers(request.headers);
    originHeaders.set("host", vercelOrigin);
    originHeaders.set("x-forwarded-host", host);
    originHeaders.set("x-vercel-deployment-url", vercelOrigin);
    const originRequest = new Request(originUrl.toString(), {
      method: request.method,
      headers: originHeaders,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "follow",
    });
    const response = await fetch(originRequest);
    return addSecurityHeaders(response);
  },
};
