import { getAddLinkItem, type AddLinkFormType } from "@/lib/add-link-catalog";

export type BuiltLinkInput = {
  linkType?: AddLinkFormType | string;
  platform?: string;
  label?: string;
  inputValue?: string;
  url?: string;
  subject?: string;
  body?: string;
  message?: string;
};

export type BuiltLinkResult = {
  inputValue: string;
  finalUrl: string;
  label: string;
  platform: string;
  iconKey: string;
  type: string;
};

const SOCIAL_URL_BUILDERS: Record<string, (value: string) => string> = {
  instagram: (value) => `https://instagram.com/${value}`,
  tiktok: (value) => `https://www.tiktok.com/@${value}`,
  facebook: (value) => `https://facebook.com/${value}`,
  x: (value) => `https://x.com/${value}`,
  twitter: (value) => `https://x.com/${value}`,
  threads: (value) => `https://www.threads.net/@${value}`,
  linkedin: (value) => `https://www.linkedin.com/in/${value}`,
  youtube: (value) => `https://www.youtube.com/@${value}`,
  telegram: (value) => `https://t.me/${value}`,
  pinterest: (value) => `https://pinterest.com/${value}`,
  snapchat: (value) => `https://snapchat.com/add/${value}`,
  github: (value) => `https://github.com/${value}`,
  behance: (value) => `https://www.behance.net/${value}`,
  dribbble: (value) => `https://dribbble.com/${value}`,
  medium: (value) => `https://medium.com/@${value}`,
  twitch: (value) => `https://www.twitch.tv/${value}`,
  discord: (value) => (value.startsWith("http") ? value : `https://discord.gg/${value}`),
  line: (value) => `https://line.me/ti/p/~${value}`,
};

const DOMAIN_TO_PLATFORM: Record<string, string> = {
  "instagram.com": "instagram",
  "www.instagram.com": "instagram",
  "tiktok.com": "tiktok",
  "www.tiktok.com": "tiktok",
  "facebook.com": "facebook",
  "www.facebook.com": "facebook",
  "x.com": "x",
  "twitter.com": "x",
  "threads.net": "threads",
  "www.threads.net": "threads",
  "linkedin.com": "linkedin",
  "www.linkedin.com": "linkedin",
  "youtube.com": "youtube",
  "www.youtube.com": "youtube",
  "youtu.be": "youtube",
  "t.me": "telegram",
  "telegram.me": "telegram",
  "pinterest.com": "pinterest",
  "snapchat.com": "snapchat",
  "github.com": "github",
  "behance.net": "behance",
  "www.behance.net": "behance",
  "dribbble.com": "dribbble",
  "medium.com": "medium",
  "discord.gg": "discord",
  "line.me": "line",
};

function stripUnsafeText(value: string) {
  return value.replace(/[<>]/g, "").trim();
}

export function normalizeCustomUrl(value: string) {
  const cleaned = stripUnsafeText(value);
  if (!cleaned) return "";
  if (/^(javascript|data|vbscript):/i.test(cleaned)) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(cleaned)) return cleaned;
  return `https://${cleaned}`;
}

export function normalizeUsernameInput(value: string, platform = "") {
  let cleaned = stripUnsafeText(value).replace(/\s+/g, "");
  const detected = detectPlatformFromUrl(cleaned);
  if (detected?.username) cleaned = detected.username;
  cleaned = cleaned.replace(/^@+/, "").replace(/\/+$/, "");
  if (platform === "discord" && /^https?:\/\//i.test(value)) return value.trim();
  return cleaned;
}

export function detectPlatformFromUrl(value: string) {
  try {
    const url = new URL(normalizeCustomUrl(value));
    const platform = DOMAIN_TO_PLATFORM[url.hostname.toLowerCase()] || null;
    if (!platform) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    let username = parts[0] || "";
    if (platform === "linkedin" && parts[0] === "in") username = parts[1] || "";
    if (platform === "snapchat" && parts[0] === "add") username = parts[1] || "";
    if (platform === "youtube") username = (parts[0] || "").replace(/^@/, "");
    return { platform, username: username.replace(/^@/, "") };
  } catch {
    return null;
  }
}

export function buildWhatsappUrl(phone: string, message = "") {
  const cleanedPhone = stripUnsafeText(phone).replace(/[^\d+]/g, "").replace(/^\+/, "");
  const normalizedPhone = cleanedPhone.startsWith("08") ? `628${cleanedPhone.slice(2)}` : cleanedPhone;
  const text = message.trim() ? `?text=${encodeURIComponent(message.trim())}` : "";
  return { inputValue: normalizedPhone, finalUrl: normalizedPhone ? `https://wa.me/${normalizedPhone}${text}` : "" };
}

export function buildEmailUrl(email: string, subject = "", body = "") {
  const cleaned = stripUnsafeText(email);
  const params = new URLSearchParams();
  if (subject.trim()) params.set("subject", subject.trim());
  if (body.trim()) params.set("body", body.trim());
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return `mailto:${cleaned}${suffix}`;
}

export function buildPhoneUrl(phone: string) {
  const cleaned = stripUnsafeText(phone).replace(/[^\d+]/g, "");
  return `tel:${cleaned}`;
}

export function buildFinalLink(input: BuiltLinkInput): BuiltLinkResult {
  const platform = (input.platform || "custom").trim().toLowerCase();
  const catalogItem = getAddLinkItem(platform);
  const formType = input.linkType || catalogItem?.formType || "custom";
  const label = stripUnsafeText(input.label || catalogItem?.label || "Custom Link");
  let inputValue = stripUnsafeText(input.inputValue || input.url || "");
  let finalUrl = "";

  if (formType === "social") {
    inputValue = normalizeUsernameInput(inputValue, platform);
    const builder = SOCIAL_URL_BUILDERS[platform] || SOCIAL_URL_BUILDERS[catalogItem?.platform || ""];
    finalUrl = builder ? builder(inputValue) : normalizeCustomUrl(inputValue);
  } else if (formType === "whatsapp") {
    const result = buildWhatsappUrl(inputValue, input.message || input.body || "");
    inputValue = result.inputValue;
    finalUrl = result.finalUrl;
  } else if (formType === "email") {
    finalUrl = buildEmailUrl(inputValue, input.subject || "", input.body || "");
  } else if (formType === "phone") {
    finalUrl = buildPhoneUrl(inputValue);
  } else if (formType === "utility") {
    finalUrl = "";
  } else {
    finalUrl = normalizeCustomUrl(input.url || inputValue);
  }

  return {
    inputValue,
    finalUrl,
    label,
    platform: catalogItem?.platform || platform,
    iconKey: catalogItem?.iconKey || platform || "link",
    type: formType === "utility" ? (platform === "divider" ? "divider" : "text") : formType === "custom" ? "link" : String(formType),
  };
}

export function validateBuiltLink(result: BuiltLinkResult) {
  if (!result.label.trim()) return "Judul tombol wajib diisi.";
  if (["text", "divider"].includes(result.type)) return null;
  if (!result.finalUrl) return "URL tidak valid.";
  if (/^(javascript|data|vbscript):/i.test(result.finalUrl)) return "URL tidak valid.";
  if (result.finalUrl.startsWith("mailto:")) return /@/.test(result.finalUrl) ? null : "Email tidak valid.";
  if (result.finalUrl.startsWith("tel:")) return result.finalUrl.length > 4 ? null : "Nomor telepon tidak valid.";
  return /^https?:\/\//i.test(result.finalUrl) ? null : "URL tidak valid.";
}
