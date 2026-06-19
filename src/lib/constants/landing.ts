import type { Lang } from "@/components/landing-new/LanguageSwitch";

export const navItems: { href: string; label: string }[] = [
  { href: "#home", label: "Beranda" },
  { href: "#fitur", label: "Fitur" },
  { href: "#harga", label: "Harga" },
  { href: "#testimoni", label: "Testimoni" },
  { href: "#faq", label: "FAQ" },
];

export const platforms = [
  "youtube",
  "tiktok",
  "instagram",
  "vimeo",
  "facebook",
  "drive",
] as const;

export type PlatformName = (typeof platforms)[number];

export const trustFeatures = [
  {
    icon: "credit-card-off",
    title: "Tanpa kartu kredit",
    description: "Mulai gratis, tidak perlu data kartu.",
  },
  {
    icon: "wallet",
    title: "Pembayaran mudah",
    description: "QRIS, GoPay, OVO, transfer bank — semua didukung.",
  },
  {
    icon: "shield",
    title: "Aman & terenkripsi",
    description: "Data dan tautanmu dilindungi SSL end-to-end.",
  },
];

export const howItWorksSteps = [
  {
    step: "Step 1",
    badge: "/01",
    title: "Pilih paket",
    description:
      "Mulai gratis atau upgrade ke Creator/Pro. Tidak perlu kartu kredit.",
    icon: "package",
    mockup: "pricing",
  },
  {
    step: "Step 2",
    badge: "/02",
    title: "Buat link",
    description:
      "Daftar username custom dan tambahkan link video dari platform apapun.",
    icon: "link",
    mockup: "builder",
  },
  {
    step: "Step 3",
    badge: "/03",
    title: "Publish",
    description:
      "Bagikan link unikmu ke semua platform dan mulai dapat klik pertama.",
    icon: "share",
    mockup: "share",
  },
] as const;

export const featureCards = [
  {
    badge: "01",
    title: "Multi-Platform Links",
    short: "Tambahkan link dari YouTube, TikTok, Instagram, Vimeo, Drive.",
    icon: "link",
    accent: "from-[#EFF6FF] to-[#DBEAFE]/40",
    mockup: "links",
  },
  {
    badge: "02",
    title: "Portfolio Profesional",
    short: "Tampilan elegan untuk showcase karya video terbaikmu.",
    icon: "layout",
    accent: "from-[#EFF6FF] to-[#BFDBFE]/40",
    mockup: "portfolio",
  },
  {
    badge: "03",
    title: "Custom Username",
    short: "Link mudah diingat: showreels.id/username-kamu.",
    icon: "edit",
    accent: "from-[#F0F7FF] to-[#BFDBFE]/40",
    mockup: "username",
    size: "tall",
  },
  {
    badge: "04",
    title: "Dashboard & Statistik",
    short: "Pantau performa portofolio real-time, kapan saja.",
    icon: "dashboard",
    accent: "from-[#F0F7FF] to-[#BFDBFE]/30",
    mockup: "dashboard",
  },
  {
    badge: "05",
    title: "Analytics Cerdas",
    short: "Insight views, clicks, dan performa konten secara mendalam.",
    icon: "analytics",
    accent: "from-[#F0F7FF] to-[#BFDBFE]/30",
    mockup: "analytics",
    size: "tall",
  },
];

export type PlanFeatureStatus =
  | "included"
  | "limited"
  | "not_included"
  | "coming_soon";

export type PlanFeature = {
  text: string;
  status: PlanFeatureStatus;
};

export type PricingPlan = {
  name: string;
  tagline: string;
  price: number;
  priceLabel: string;
  period: string;
  cta: string;
  featured: boolean;
  badge?: string;
  features: PlanFeature[];
};

export const pricingPlans: PricingPlan[] = [
  {
    name: "Basic",
    tagline: "Cocok untuk pengguna baru yang ingin mencoba fitur dasar.",
    price: 0,
    priceLabel: "Rp0",
    period: "/bulan",
    cta: "Mulai Gratis",
    featured: false,
    features: [
      { text: "Maksimal 5 link", status: "limited" },
      { text: "Analytics 7 hari", status: "limited" },
      { text: "10 video / platform", status: "limited" },
      { text: "Custom Thumbnail", status: "not_included" },
      { text: "Centang Biru", status: "not_included" },
      { text: "Creator Group", status: "not_included" },
      { text: "Whitelabel", status: "not_included" },
      { text: "Theme Switch", status: "not_included" },
      { text: "Support standar", status: "included" },
    ],
  },
  {
    name: "Creator",
    tagline: "Kontrol dan kapasitas lebih untuk creator aktif.",
    price: 25000,
    priceLabel: "Rp25.000",
    period: "/bulan",
    cta: "Pilih Creator",
    featured: true,
    badge: "Populer",
    features: [
      { text: "Link Builder tanpa batas", status: "included" },
      { text: "Analytics 30 hari", status: "limited" },
      { text: "50 video / platform", status: "limited" },
      { text: "Custom Thumbnail", status: "included" },
      { text: "Centang Biru aktif selama plan berjalan", status: "included" },
      { text: "Creator Group", status: "included" },
      { text: "Whitelabel", status: "included" },
      { text: "Theme Switch", status: "coming_soon" },
      { text: "Support prioritas", status: "included" },
    ],
  },
];

export const stats: { value: number; suffix: string; label: string }[] = [
  { value: 12, suffix: "K+", label: "Kreator terdaftar" },
  { value: 250, suffix: "K+", label: "Video terhubung" },
  { value: 98, suffix: "%", label: "Uptime terjamin" },
  { value: 5, suffix: "★", label: "Rating pengguna" },
];

export const faqs = [
  {
    q: "Apa itu showreels.id?",
    a: "Platform portofolio video yang menyatukan karya dari YouTube, TikTok, Instagram, Vimeo, dan lainnya dalam satu link.",
  },
  {
    q: "Apakah bisa gratis selamanya?",
    a: "Ya, paket Starter gratis selamanya. Upgrade kapan saja untuk fitur lanjutan.",
  },
  {
    q: "Apakah ada watermark?",
    a: "Tidak ada watermark pada paket apapun, termasuk paket Starter gratis.",
  },
  {
    q: "Bisakah pakai custom domain?",
    a: "Tentu. Paket Creator dan Pro mendukung custom domain kamu sendiri.",
  },
  {
    q: "Bagaimana cara membagikannya?",
    a: "Cukup salin link unikmu dan bagikan ke Instagram bio, TikTok, atau platform apapun.",
  },
  {
    q: "Di mana contoh portofolio?",
    a: "Kamu bisa langsung cek username di hero section untuk melihat contoh portofolio publik.",
  },
];

export const navbarPhones = [
  {
    id: "creator-1",
    name: "Rina Adelia",
    handle: "@rinaa",
    role: "Videographer",
    initial: "R",
    photo:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces",
  },
  {
    id: "creator-2",
    name: "Ogah Pratama",
    handle: "@ogah.dev",
    role: "UI Designer",
    initial: "O",
    photo:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=faces",
  },
  {
    id: "creator-3",
    name: "Puput Maria",
    handle: "@puputmaria",
    role: "Content Creator",
    initial: "P",
    photo:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces",
  },
  {
    id: "creator-4",
    name: "Adhit Budi",
    handle: "@adhit.budi",
    role: "Filmmaker",
    initial: "A",
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
  },
  {
    id: "creator-5",
    name: "Aulia Putri",
    handle: "@auliaa",
    role: "Photographer",
    initial: "A",
    photo:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=faces",
  },
  {
    id: "creator-6",
    name: "Bima Sakti",
    handle: "@bimaa",
    role: "Editor",
    initial: "B",
    photo:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces",
  },
] as const;

export const phones = navbarPhones.map((p) => ({
  ...p,
  variant: (["clean", "warm", "focus", "soft"] as const)[
    Number(p.id.split("-")[1]) % 4
  ],
  links: [
    { label: "YouTube Reels", icon: "youtube" },
    { label: "TikTok Portfolio", icon: "tiktok" },
    { label: "Instagram Reels", icon: "instagram" },
    { label: "Hubungi Saya", icon: "mail" },
  ],
}));

export const testimonials = [
  {
    quote:
      "Portfolio jadi jauh lebih rapi. Klien langsung klik dari Instagram.",
    name: "Rahmat Nugroho",
    role: "Web Developer",
    avatar: "RN",
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces",
  },
  {
    quote: "Clean, simpel, dan tampil profesional tanpa ribet setup.",
    name: "Dinda Lestari",
    role: "UI/UX Designer",
    avatar: "DL",
    photo:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces",
  },
  {
    quote: "Semua video dari berbagai platform dalam satu link. Game changer.",
    name: "Andhika Putra",
    role: "Photographer",
    avatar: "AP",
    photo:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=160&h=160&fit=crop&crop=faces",
  },
  {
    quote:
      "Cukup share satu link di bio Instagram, viewer langsung explore.",
    name: "Sasha Anindya",
    role: "Content Creator",
    avatar: "SA",
    photo:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&h=160&fit=crop&crop=faces",
  },
  {
    quote:
      "Sekarang klien lihat semua showreel tanpa harus kirim satu-satu.",
    name: "Bagas Pramudya",
    role: "Video Editor",
    avatar: "BP",
    photo:
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=160&h=160&fit=crop&crop=faces",
  },
];

export type LangType = Lang;