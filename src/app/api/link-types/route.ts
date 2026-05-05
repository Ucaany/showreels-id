import { NextResponse } from "next/server";
import { ADD_LINK_CATEGORIES, getItemsForCategory } from "@/lib/add-link-catalog";

export async function GET() {
  return NextResponse.json({
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
  });
}
