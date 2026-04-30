export type AddLinkCategoryId =
  | "suggested"
  | "social"
  | "media"
  | "commerce"
  | "event"
  | "form"
  | "contact"
  | "portfolio"
  | "utility";

export type AddLinkFormType =
  | "custom"
  | "social"
  | "whatsapp"
  | "email"
  | "phone"
  | "media"
  | "event"
  | "form"
  | "portfolio"
  | "utility";

export type AddLinkItem = {
  id: string;
  label: string;
  platform: string;
  category: AddLinkCategoryId;
  formType: AddLinkFormType;
  iconKey: string;
  description: string;
  badge?: string;
  featured?: boolean;
  isPremium?: boolean;
  placeholder?: string;
};

export type AddLinkCategory = {
  id: AddLinkCategoryId;
  label: string;
  icon: string;
  description: string;
};

export const ADD_LINK_CATEGORIES: AddLinkCategory[] = [
  { id: "suggested", label: "Suggested", icon: "sparkles", description: "Rekomendasi paling sering dipakai" },
  { id: "social", label: "Social", icon: "heart", description: "Username social media" },
  { id: "media", label: "Media", icon: "play", description: "Video, musik, dan podcast" },
  { id: "commerce", label: "Commerce", icon: "store", description: "Toko, produk, dan order" },
  { id: "event", label: "Event", icon: "calendar", description: "Event, booking, webinar" },
  { id: "form", label: "Form", icon: "form", description: "Survey, pendaftaran, kontak" },
  { id: "contact", label: "Contact", icon: "contact", description: "Email, telepon, lokasi" },
  { id: "portfolio", label: "Portfolio", icon: "briefcase", description: "Karya, CV, case study" },
  { id: "utility", label: "Text & Utility", icon: "text", description: "Heading, divider, pengumuman" },
];

const items = [
  ["custom-link", "Custom Link", "custom", "suggested", "custom", "link", "Tambahkan URL bebas", "Popular", true, false, "https://website.com"],
  ["instagram", "Instagram", "instagram", "social", "social", "instagram", "Isi username Instagram saja", "Popular", true, false, "ucaanystore"],
  ["tiktok", "TikTok", "tiktok", "social", "social", "tiktok", "Isi username TikTok saja", "Popular", true, false, "ucaanystore"],
  ["youtube", "YouTube", "youtube", "media", "social", "youtube", "Channel atau handle YouTube", "Popular", true, false, "ucaanystore"],
  ["whatsapp", "WhatsApp", "whatsapp", "contact", "whatsapp", "whatsapp", "Chat WhatsApp dengan pesan default", "Popular", true, false, "628123456789"],
  ["portfolio-video", "Portfolio Video", "portfolio", "portfolio", "portfolio", "video", "Tautkan portfolio video Showreels", "Creator Plan", true, false, "https://..."],
  ["email", "Email", "email", "contact", "email", "email", "Buka email dengan subject opsional", undefined, true, false, "hello@domain.com"],
  ["website", "Website", "website", "suggested", "custom", "website", "Tambahkan website personal", undefined, true, false, "https://website.com"],
  ["facebook", "Facebook", "facebook", "social", "social", "facebook", "Isi username atau page Facebook"],
  ["x", "X / Twitter", "x", "social", "social", "x", "Isi username X tanpa @"],
  ["threads", "Threads", "threads", "social", "social", "threads", "Isi username Threads saja"],
  ["linkedin", "LinkedIn", "linkedin", "social", "social", "linkedin", "Isi slug profil LinkedIn"],
  ["snapchat", "Snapchat", "snapchat", "social", "social", "snapchat", "Isi username Snapchat"],
  ["pinterest", "Pinterest", "pinterest", "social", "social", "pinterest", "Isi username Pinterest"],
  ["telegram", "Telegram", "telegram", "social", "social", "telegram", "Isi username Telegram"],
  ["discord", "Discord", "discord", "social", "social", "discord", "Invite code atau URL Discord"],
  ["line", "Line", "line", "social", "social", "line", "Isi Line ID"],
  ["spotify", "Spotify", "spotify", "media", "media", "spotify", "Artist, playlist, atau track URL"],
  ["apple-music", "Apple Music", "apple-music", "media", "media", "music", "Link artist, album, atau playlist"],
  ["soundcloud", "SoundCloud", "soundcloud", "media", "media", "music", "Link track atau profil SoundCloud"],
  ["twitch", "Twitch", "twitch", "media", "social", "twitch", "Isi username Twitch"],
  ["vimeo", "Vimeo", "vimeo", "media", "media", "video", "Link video Vimeo"],
  ["google-drive-video", "Google Drive Video", "gdrive", "media", "media", "gdrive", "Shared URL Google Drive"],
  ["tokopedia", "Tokopedia", "tokopedia", "commerce", "custom", "tokopedia", "Link toko atau produk Tokopedia"],
  ["shopee", "Shopee", "shopee", "commerce", "custom", "shopee", "Link toko atau produk Shopee"],
  ["tiktok-shop", "TikTok Shop", "tiktokshop", "commerce", "custom", "tiktokshop", "Link produk TikTok Shop"],
  ["lazada", "Lazada", "lazada", "commerce", "custom", "store", "Link toko atau produk Lazada"],
  ["order-form", "Order Form", "order-form", "commerce", "form", "form", "Form order cepat"],
  ["event-link", "Event Link", "event", "event", "event", "calendar", "URL event dengan tanggal opsional"],
  ["calendly", "Calendly", "calendly", "event", "custom", "calendar", "Link booking Calendly"],
  ["ticket-link", "Ticket Link", "ticket", "event", "event", "ticket", "Link pembelian tiket"],
  ["google-form", "Google Form", "google-form", "form", "form", "form", "Link Google Form"],
  ["typeform", "Typeform", "typeform", "form", "form", "form", "Link Typeform"],
  ["tally", "Tally", "tally", "form", "form", "form", "Link Tally form"],
  ["phone", "Phone", "phone", "contact", "phone", "phone", "Nomor telepon langsung"],
  ["location", "Location / Google Maps", "maps", "contact", "custom", "maps", "Link Google Maps"],
  ["business-inquiry", "Business Inquiry", "business", "contact", "email", "email", "Email khusus kerja sama"],
  ["portfolio-page", "Portfolio Page", "portfolio-page", "portfolio", "portfolio", "briefcase", "Link halaman portfolio"],
  ["case-study", "Case Study", "case-study", "portfolio", "portfolio", "briefcase", "Link case study"],
  ["resume", "Resume / CV", "resume", "portfolio", "custom", "file", "Link CV atau resume"],
  ["behance", "Behance", "behance", "portfolio", "social", "behance", "Isi username Behance"],
  ["dribbble", "Dribbble", "dribbble", "portfolio", "social", "dribbble", "Isi username Dribbble"],
  ["github", "GitHub", "github", "portfolio", "social", "github", "Isi username GitHub"],
  ["medium", "Medium", "medium", "portfolio", "social", "medium", "Isi username Medium"],
  ["notion", "Notion Portfolio", "notion", "portfolio", "custom", "briefcase", "Link Notion portfolio"],
  ["heading", "Heading Text", "heading", "utility", "utility", "text", "Judul section tanpa URL"],
  ["description", "Description Text", "description", "utility", "utility", "text", "Teks deskripsi pendek"],
  ["divider", "Divider", "divider", "utility", "utility", "divider", "Garis pemisah antar section"],
  ["announcement", "Announcement", "announcement", "utility", "utility", "sparkles", "Pengumuman singkat"],
] as const;

export const ADD_LINK_ITEMS: AddLinkItem[] = items.map((item) => ({
  id: item[0],
  label: item[1],
  platform: item[2],
  category: item[3] as AddLinkCategoryId,
  formType: item[4] as AddLinkFormType,
  iconKey: item[5],
  description: item[6],
  badge: item[7],
  featured: Boolean(item[8]),
  isPremium: Boolean(item[9]),
  placeholder: item[10],
}));

export function getAddLinkItem(id: string) {
  return ADD_LINK_ITEMS.find((item) => item.id === id || item.platform === id) || null;
}

export function getItemsForCategory(categoryId: AddLinkCategoryId) {
  if (categoryId === "suggested") {
    const suggestedIds = new Set(["custom-link", "instagram", "tiktok", "youtube", "whatsapp", "portfolio-video", "email", "website"]);
    return ADD_LINK_ITEMS.filter((item) => suggestedIds.has(item.id));
  }
  return ADD_LINK_ITEMS.filter((item) => item.category === categoryId);
}
