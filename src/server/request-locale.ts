import { cookies } from "next/headers";
import { resolveLocale } from "@/lib/i18n";

export async function getRequestLocale() {
  const store = await cookies();
  return resolveLocale(store.get("locale")?.value);
}
