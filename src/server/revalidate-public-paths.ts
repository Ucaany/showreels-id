import { revalidatePath } from "next/cache";
import {
  getCreatorBioHref,
  getCreatorPortfolioHref,
  getVideoDetailHref,
} from "@/lib/public-route-utils";

/** Refresh ISR/static paths for a creator bio + portfolio grid. */
export function revalidateCreatorPublicPaths(username: string | null | undefined): void {
  const u = username?.trim();
  if (!u) return;
  try {
    revalidatePath(getCreatorBioHref(u));
    revalidatePath(getCreatorPortfolioHref(u));
  } catch {
    /* ignore */
  }
}

/** Refresh public video detail route(s). Pass old + new slug when title/slug changes. */
export function revalidatePublicVideoPages(slugs: Array<string | null | undefined>): void {
  const seen = new Set<string>();
  for (const raw of slugs) {
    const s = raw?.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    try {
      revalidatePath(getVideoDetailHref(s));
    } catch {
      /* ignore */
    }
  }
}
