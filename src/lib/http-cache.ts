/** Cache-Control untuk respons API publik yang aman di-cache edge (PRD). */
export const CACHE_CONTROL_PUBLIC_SWR =
  "public, max-age=60, stale-while-revalidate=86400";

export const CACHE_CONTROL_PRIVATE_NO_STORE = "private, no-store";

export function withPublicCacheHeaders(headers?: HeadersInit): Headers {
  const h = new Headers(headers);
  if (!h.has("Cache-Control")) {
    h.set("Cache-Control", CACHE_CONTROL_PUBLIC_SWR);
  }
  return h;
}

export function withPrivateNoStoreHeaders(headers?: HeadersInit): Headers {
  const h = new Headers(headers);
  h.set("Cache-Control", CACHE_CONTROL_PRIVATE_NO_STORE);
  return h;
}
