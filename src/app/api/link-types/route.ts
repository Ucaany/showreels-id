import { NextResponse } from "next/server";
import { ADD_LINK_CATEGORIES, getItemsForCategory } from "@/lib/add-link-catalog";

/**
 * GET /api/link-types
 * Returns static catalog data — cached aggressively since it rarely changes.
 */
export async function GET() {
  const payload = {
    categories: ADD_LINK_CATEGORIES.map((category) => ({
      ...category,
      items: getItemsForCategory(category.id).map((item) => ({
        id: item.id,
        label: item.label,
        platform: item.platform,
        input_type: item.formType === "social" ? "username" : item.formType,
        icon_key: item.iconKey,
        description: item.description,
        badge: item.badge,
        featured: item.featured,
        is_premium: Boolean(item.isPremium),
        placeholder: item.placeholder,
      })),
    })),
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
