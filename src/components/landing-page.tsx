"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  LayoutGrid,
  List,
  LogOut,
  Menu,
  PlayCircle,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { SitePreferences } from "@/components/site-preferences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePreferences } from "@/hooks/use-preferences";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { getThumbnailCandidates } from "@/lib/video-utils";
import { getVideoSourceBadgeMeta } from "@/lib/video-source-badge";

const CREATOR_ROTATION_INTERVAL_MS = 5 * 60 * 1000;
const CREATOR_DEVICE_SEED_KEY = "showreels-featured-creator-seed-v2";

const THEME_SURFACE_STYLES = [
  {
    frame: "from-[#f6b391] via-[#ef8766] to-[#d54b33]",
    shell: "bg-[#fff8f3] border-[#efcabd] text-[#2b1d18]",
    chip: "bg-white/92 text-[#5a3a30]",
  },
  {
    frame: "from-[#efe0bb] via-[#d4b785] to-[#9e7042]",
    shell: "bg-[#fffaf1] border-[#e8d4ab] text-[#312317]",
    chip: "bg-white/92 text-[#5b4630]",
  },
  {
    frame: "from-[#dce2d4] via-[#b0c2a2] to-[#66785e]",
    shell: "bg-[#f6faf3] border-[#cad8c0] text-[#1d281b]",
    chip: "bg-white/90 text-[#31452c]",
  },
  {
    frame: "from-[#d9e2e3] via-[#9eb9bb] to-[#496b6f]",
    shell: "bg-[#f5fafb] border-[#c3d7d9] text-[#15262a]",
    chip: "bg-white/92 text-[#284449]",
  },
  {
    frame: "from-[#514943] via-[#2f2722] to-[#14100d]",
    shell: "bg-[#17120f] border-[#342b26] text-white",
    chip: "bg-white/10 text-white",
  },
] as const;

type UsernameStatus = "idle" | "checking" | "invalid" | "available" | "taken";

function createSeededHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle<T extends { id: string }>(items: T[], seed: string): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const hash = createSeededHash(`${seed}-${result[index].id}-${index}`);
    const swapIndex = hash % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function sanitizeUsernameInput(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}

function getRevealProps(prefersReducedMotion: boolean | null, delay = 0) {
  if (prefersReducedMotion) {
    return {};
  }

  return {
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: {
      duration: 0.48,
      delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  };
}

function LandingFaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <m.article layout className="border-b border-[#eaded4] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left sm:py-6"
      >
        <span className="text-base font-semibold leading-7 text-[#1b1410] sm:text-lg">
          {question}
        </span>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#dccfc5] bg-[#f8f2ec] text-[#6d5d54]">
          {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="max-w-3xl pb-6 text-sm leading-7 text-[#5d5048] sm:text-base sm:leading-8">
              {answer}
            </p>
          </m.div>
        ) : null}
      </AnimatePresence>
    </m.article>
  );
}

function LandingSectionHeader({
  badge,
  titleLead,
  titleAccent,
  description,
  center = false,
}: {
  badge: string;
  titleLead: string;
  titleAccent: string;
  description: string;
  center?: boolean;
}) {
  return (
    <div className={cn("max-w-3xl", center && "mx-auto text-center")}>
      <Badge className="rounded-full border border-[#e6d2c4] bg-[#fff1e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#dc563b] shadow-none">
        {badge}
      </Badge>
      <h2 className="mt-4 text-[2rem] font-bold leading-[1.02] tracking-[-0.04em] text-[#18120f] sm:text-[2.9rem] lg:text-[3.35rem]">
        {titleLead}{" "}
        <span className="font-accent text-[#dd593e]">{titleAccent}</span>
      </h2>
      <p className="mt-4 text-base leading-8 text-[#5d5048] sm:text-lg sm:leading-9">
        {description}
      </p>
    </div>
  );
}

interface LandingPageProps {
  creatorCount: number;
  videoCount: number;
  featuredCreators: Array<{
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    bio: string;
    city: string;
    createdAt: Date;
  }>;
  featuredVideos: Array<{
    id: string;
    title: string;
    publicSlug: string;
    description: string;
    createdAt: Date;
    sourceUrl: string;
    thumbnailUrl: string;
    outputType: string;
    durationLabel: string;
    author: {
      username: string | null;
      name: string | null;
      image: string | null;
    };
  }>;
  currentUser?: {
    name: string | null;
    username: string | null;
    image: string | null;
    email: string;
  } | null;
}

export function LandingPage({
  creatorCount,
  videoCount,
  featuredCreators,
  featuredVideos,
  currentUser = null,
}: LandingPageProps) {
  const { dictionary, locale } = usePreferences();
  const supabase = createClient();
  const prefersReducedMotion = useReducedMotion();
  const year = new Date().getFullYear();
  const localeCode = locale === "en" ? "en-US" : "id-ID";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [latestVideosView, setLatestVideosView] = useState<"grid" | "list">("grid");
  const [isDesktop, setIsDesktop] = useState(false);
  const [creatorDeviceSeed, setCreatorDeviceSeed] = useState("creator-seed-default");
  const [creatorTimeBucket, setCreatorTimeBucket] = useState(0);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameAsyncStatus, setUsernameAsyncStatus] = useState<
    Exclude<UsernameStatus, "invalid">
  >("idle");
  const [usernameSuggestion, setUsernameSuggestion] = useState("");

  const loginLabel = dictionary.login?.trim() || (locale === "en" ? "Login" : "Masuk");

  const sanitizedUsername = useMemo(
    () => sanitizeUsernameInput(usernameInput),
    [usernameInput]
  );

  useEffect(() => {
    const syncViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncSeed = () => {
      const fromStorage = window.localStorage.getItem(CREATOR_DEVICE_SEED_KEY);
      if (fromStorage) {
        setCreatorDeviceSeed(fromStorage);
        return;
      }

      const nextSeed =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      window.localStorage.setItem(CREATOR_DEVICE_SEED_KEY, nextSeed);
      setCreatorDeviceSeed(nextSeed);
    };

    const timeout = window.setTimeout(syncSeed, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const rotate = () => {
      setCreatorTimeBucket(Math.floor(Date.now() / CREATOR_ROTATION_INTERVAL_MS));
    };

    const initialSync = window.setTimeout(rotate, 0);
    const timer = window.setInterval(rotate, CREATOR_ROTATION_INTERVAL_MS);
    return () => {
      window.clearTimeout(initialSync);
      window.clearInterval(timer);
    };
  }, []);

  const rawUsernameInput = usernameInput.trim();
  const isUsernameFormatValid = /^[a-zA-Z0-9_]{3,24}$/.test(rawUsernameInput);
  const usernameStatus: UsernameStatus = !rawUsernameInput
    ? "idle"
    : !isUsernameFormatValid
      ? "invalid"
      : usernameAsyncStatus;

  useEffect(() => {
    if (!isUsernameFormatValid) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/public/username-availability?username=${encodeURIComponent(rawUsernameInput)}`,
          { signal: controller.signal }
        );
        const payload = (await response.json().catch(() => null)) as
          | {
              reason?: UsernameStatus;
              available?: boolean;
              suggestion?: string;
            }
          | null;

        if (!response.ok || !payload) {
          setUsernameAsyncStatus("idle");
          setUsernameSuggestion("");
          return;
        }

        if (payload.reason === "available") {
          setUsernameAsyncStatus("available");
          setUsernameSuggestion("");
          return;
        }

        if (payload.reason === "taken") {
          setUsernameAsyncStatus("taken");
          setUsernameSuggestion(payload.suggestion || "");
          return;
        }

        setUsernameAsyncStatus("idle");
        setUsernameSuggestion(payload.suggestion || "");
      } catch {
        setUsernameAsyncStatus("idle");
        setUsernameSuggestion("");
      }
    }, 360);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [isUsernameFormatValid, rawUsernameInput]);

  const featuredCreatorCards = useMemo(() => {
    const creatorsWithBio = featuredCreators.filter(
      (creator) => creator.bio && creator.bio.trim().length > 0
    );
    const creatorsWithoutBio = featuredCreators.filter(
      (creator) => !creator.bio || creator.bio.trim().length === 0
    );

    const seedBase = `${creatorDeviceSeed}-${creatorTimeBucket}`;
    const shuffledWithBio = seededShuffle(creatorsWithBio, `${seedBase}-with-bio`);
    const shuffledWithoutBio = seededShuffle(
      creatorsWithoutBio,
      `${seedBase}-without-bio`
    );

    return [...shuffledWithBio, ...shuffledWithoutBio].slice(0, 6);
  }, [featuredCreators, creatorDeviceSeed, creatorTimeBucket]);

  const latestVideoRows = useMemo(() => featuredVideos.slice(0, 6), [featuredVideos]);
  const maxVisibleVideos = isDesktop ? 3 : 2;
  const visibleLatestVideos = useMemo(
    () => latestVideoRows.slice(0, maxVisibleVideos),
    [latestVideoRows, maxVisibleVideos]
  );

  const marketingFeatures = useMemo(
    () => [
      {
        tag: locale === "en" ? "Quick build" : "Build cepat",
        title:
          locale === "en"
            ? "Creator page, links, and videos in one polished flow."
            : "Halaman creator, link, dan video dalam satu alur yang rapi.",
        description:
          locale === "en"
            ? "Organize custom links, public profile details, and best work without switching tools."
            : "Atur custom link, detail profil publik, dan karya terbaik tanpa pindah-pindah tools.",
      },
      {
        tag: locale === "en" ? "Video ready" : "Siap video",
        title:
          locale === "en"
            ? "Show highlight reels with stronger context."
            : "Tampilkan highlight reel dengan konteks yang lebih kuat.",
        description:
          locale === "en"
            ? "Every public video keeps title, creator identity, source badge, and clean metadata."
            : "Setiap video publik tetap membawa judul, identitas creator, badge sumber, dan metadata yang bersih.",
      },
      {
        tag: locale === "en" ? "Flexible" : "Fleksibel",
        title:
          locale === "en"
            ? "Themes stay expressive without breaking the structure."
            : "Tema tetap ekspresif tanpa merusak struktur konten.",
        description:
          locale === "en"
            ? "Use visual presets for campaign mode, portfolio mode, or personal brand mode."
            : "Pakai preset visual untuk campaign mode, portfolio mode, atau personal brand mode.",
      },
      {
        tag: locale === "en" ? "Share fast" : "Cepat dibagikan",
        title:
          locale === "en"
            ? "Username claim and publish flow stays frictionless."
            : "Flow claim username dan publish tetap ringan tanpa hambatan.",
        description:
          locale === "en"
            ? "Check availability live, then claim your page and move straight into setup."
            : "Cek ketersediaan secara live, lalu claim halamanmu dan langsung lanjut setup.",
      },
    ],
    [locale]
  );

  const themePresets = useMemo(() => {
    const featureList = {
      customLinks: dictionary.landingThemesFeatureCustomLinks,
      socialLinks: dictionary.landingThemesFeatureSocialLinks,
      videoHighlight: dictionary.landingThemesFeatureVideoHighlight,
      contact: dictionary.landingThemesFeatureContact,
      visibility: dictionary.landingThemesFeatureVisibility,
      portfolio: dictionary.landingThemesFeaturePortfolio,
    };

    return [
      {
        name: dictionary.landingThemesPresetStarter,
        handle: "@creator.starter",
        summary:
          locale === "en"
            ? "Warm, direct, and ideal for solo creators."
            : "Hangat, lugas, dan cocok untuk creator solo.",
        featureHighlights: [
          featureList.customLinks,
          featureList.videoHighlight,
          featureList.contact,
          featureList.socialLinks,
        ],
        style: THEME_SURFACE_STYLES[0],
      },
      {
        name: dictionary.landingThemesPresetCampaign,
        handle: "@creator.campaign",
        summary:
          locale === "en"
            ? "Built to push launches, promos, and latest drops."
            : "Dibuat untuk launch, promo, dan rilisan terbaru.",
        featureHighlights: [
          featureList.videoHighlight,
          featureList.customLinks,
          featureList.socialLinks,
          featureList.portfolio,
        ],
        style: THEME_SURFACE_STYLES[1],
      },
      {
        name: dictionary.landingThemesPresetStudio,
        handle: "@studio.reels",
        summary:
          locale === "en"
            ? "Balanced for agencies, studios, and client decks."
            : "Seimbang untuk studio, agency, dan kebutuhan client deck.",
        featureHighlights: [
          featureList.portfolio,
          featureList.videoHighlight,
          featureList.contact,
          featureList.visibility,
        ],
        style: THEME_SURFACE_STYLES[2],
      },
      {
        name: dictionary.landingThemesPresetPersonal,
        handle: "@personal.brand",
        summary:
          locale === "en"
            ? "More editorial for personal brand storytelling."
            : "Lebih editorial untuk personal brand storytelling.",
        featureHighlights: [
          featureList.customLinks,
          featureList.socialLinks,
          featureList.visibility,
          featureList.contact,
        ],
        style: THEME_SURFACE_STYLES[3],
      },
      {
        name: dictionary.landingThemesPresetAgency,
        handle: "@agency.showcase",
        summary:
          locale === "en"
            ? "Clean and bold for teams with multiple offers."
            : "Bersih dan tegas untuk tim dengan banyak penawaran.",
        featureHighlights: [
          featureList.portfolio,
          featureList.customLinks,
          featureList.contact,
          featureList.visibility,
        ],
        style: THEME_SURFACE_STYLES[4],
      },
    ];
  }, [dictionary, locale]);

  const pricingPlans = useMemo(
    () => [
      {
        name: "Free",
        price: "Rp0",
        subtitle: dictionary.landingPricingFree,
        points: [
          locale === "en" ? "Basic profile blocks" : "Blok profil dasar",
          locale === "en" ? "3 custom links" : "3 custom link",
          locale === "en" ? "showreels subdomain" : "Subdomain showreels",
        ],
        featured: false,
      },
      {
        name: "Pro",
        price: "Rp49k",
        subtitle: dictionary.landingPricingPro,
        points: [
          locale === "en" ? "Unlimited links" : "Link tanpa batas",
          locale === "en" ? "Weekly analytics" : "Analytics mingguan",
          locale === "en" ? "Theme customization" : "Custom tema",
        ],
        featured: true,
      },
      {
        name: "Team",
        price: "Rp149k",
        subtitle: dictionary.landingPricingTeam,
        points: [
          locale === "en" ? "Multi-member workspace" : "Workspace multi-member",
          locale === "en" ? "Priority support" : "Priority support",
          locale === "en" ? "Custom domain + brand kit" : "Custom domain + brand kit",
        ],
        featured: false,
      },
    ],
    [dictionary, locale]
  );

  const marketingTestimonials = useMemo(
    () => [
      {
        quote:
          locale === "en"
            ? "My page finally feels like a portfolio, not just a list of links."
            : "Halaman saya akhirnya terasa seperti portfolio, bukan cuma daftar link.",
        name: "Rara Aurelia",
        role:
          locale === "en"
            ? "Illustrator & Content Creator"
            : "Illustrator & Content Creator",
        light: true,
      },
      {
        quote:
          locale === "en"
            ? "Clients can jump from creator profile to selected videos much faster now."
            : "Klien bisa pindah dari profil creator ke video pilihan dengan jauh lebih cepat.",
        name: "Dio Pratama",
        role: locale === "en" ? "Podcaster & Creator" : "Podcaster & Kreator Konten",
        light: false,
      },
      {
        quote:
          locale === "en"
            ? "The setup feels simple, but the result looks premium enough to send to brands."
            : "Setup-nya tetap simpel, tapi hasilnya sudah cukup premium untuk dikirim ke brand.",
        name: "Maya Kusuma",
        role: locale === "en" ? "Digital Brand Owner" : "Pemilik Brand Digital",
        light: true,
      },
    ],
    [locale]
  );

  const marketingFaqItems = useMemo(
    () => [
      {
        question:
          locale === "en"
            ? "How is showreels.id different from generic link tools?"
            : "Apa yang membedakan showreels.id dari link tool generik?",
        answer:
          locale === "en"
            ? "showreels.id is built around creator portfolios, so links, profile identity, and public videos are presented as one client-ready experience."
            : "showreels.id dibangun untuk portfolio creator, jadi link, identitas profil, dan video publik tampil sebagai satu pengalaman yang siap dilihat klien.",
      },
      {
        question:
          locale === "en"
            ? "Can I start from a free plan first?"
            : "Apakah saya bisa mulai dari paket gratis dulu?",
        answer:
          locale === "en"
            ? "Yes. You can start from Free, publish your profile, then upgrade when you need more control."
            : "Bisa. Kamu bisa mulai dari Free, publish profilmu, lalu upgrade saat butuh kontrol yang lebih luas.",
      },
      {
        question:
          locale === "en"
            ? "Will my public profile stay mobile-friendly?"
            : "Apakah profil publik saya tetap rapi di handphone?",
        answer:
          locale === "en"
            ? "Yes. The public page is designed to stay readable and aligned on phone and desktop."
            : "Ya. Halaman publik dirancang agar tetap mudah dibaca dan sejajar baik di handphone maupun desktop.",
      },
      {
        question:
          locale === "en"
            ? "Can I move from another bio link platform?"
            : "Bisakah saya pindah dari platform bio link lain?",
        answer:
          locale === "en"
            ? "Yes. Bring your current links, choose a theme, then rebuild the page around your creator profile and videos."
            : "Bisa. Bawa link yang sekarang kamu pakai, pilih tema, lalu susun ulang halaman berdasarkan profil creator dan video kamu.",
      },
      {
        question:
          locale === "en"
            ? "Who is this best for?"
            : "Platform ini paling cocok untuk siapa?",
        answer:
          locale === "en"
            ? "Creators, editors, videographers, studios, and small teams that want one memorable page for public work."
            : "Creator, editor, videografer, studio, dan tim kecil yang butuh satu halaman publik yang mudah diingat untuk karya mereka.",
      },
    ],
    [locale]
  );

  const creatorCountLabel = creatorCount.toLocaleString(localeCode);
  const videoCountLabel = videoCount.toLocaleString(localeCode);
  const heroCreator = featuredCreators[0] || null;
  const heroVideo = featuredVideos[0] || null;
  const heroVideoThumbnail = heroVideo
    ? getThumbnailCandidates(heroVideo.sourceUrl, heroVideo.thumbnailUrl)[0] || ""
    : "";
  const heroVideoSourceMeta = heroVideo
    ? getVideoSourceBadgeMeta(heroVideo.sourceUrl)
    : null;
  const heroPreviewUsername =
    sanitizedUsername ||
    heroCreator?.username ||
    (locale === "en" ? "your_name" : "nama_kamu");
  const primaryCtaHref = currentUser ? "/dashboard" : "/auth/signup";
  const primaryCtaLabel = currentUser
    ? dictionary.landingCtaSecondary
    : dictionary.landingCtaPrimary;

  const heroQuickLinks = useMemo(
    () => [
      {
        label: locale === "en" ? "Featured video" : "Video unggulan",
        value:
          heroVideo?.title ||
          (locale === "en" ? "Latest campaign reel" : "Highlight campaign terbaru"),
      },
      {
        label: locale === "en" ? "Profile links" : "Link utama",
        value: locale === "en" ? "Media kit, booking, socials" : "Media kit, booking, social",
      },
      {
        label: locale === "en" ? "Availability" : "Ketersediaan",
        value: locale === "en" ? "Open for collabs" : "Open for collab",
      },
    ],
    [heroVideo?.title, locale]
  );

  const statusLabel =
    usernameStatus === "checking"
      ? dictionary.landingHeroStatusChecking
      : usernameStatus === "available"
        ? dictionary.landingHeroStatusAvailable
        : usernameStatus === "taken"
        ? dictionary.landingHeroStatusTaken
          : usernameStatus === "invalid"
            ? dictionary.landingHeroStatusInvalid
            : dictionary.landingHeroStatusIdle;

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen bg-canvas text-[#201b18]">
        <header className="sticky top-0 z-50 border-b border-[#dfd0c5] bg-[#f7f0e9]/85 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <AppLogo />

            <nav className="hidden items-center gap-7 text-[0.98rem] font-medium text-[#5f5148] lg:flex">
              <a href="#features" className="transition hover:text-[#1f1814]">
                {dictionary.landingNavFeatures}
              </a>
              <a href="#themes" className="transition hover:text-[#1f1814]">
                {dictionary.landingNavThemes}
              </a>
              <a href="#pricing" className="transition hover:text-[#1f1814]">
                {dictionary.landingNavPricing}
              </a>
              <a href="#faq" className="transition hover:text-[#1f1814]">
                {dictionary.landingNavFaq}
              </a>
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <SitePreferences compact />
              {currentUser ? (
                <>
                  <Link href="/dashboard">
                    <Button
                      variant="secondary"
                      className="rounded-full border-[#dccdc2] bg-white/90"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#ddd0c6] bg-white/88 px-2.5 py-1.5">
                    <AvatarBadge
                      name={currentUser.name || "Creator"}
                      avatarUrl={currentUser.image || ""}
                      size="sm"
                    />
                    <span className="pr-1 text-sm font-semibold text-[#3e332d]">
                      @{currentUser.username || "creator"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.replace("/");
                    }}
                    className="rounded-full"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm font-semibold text-[#433833]">
                    {loginLabel}
                  </Link>
                  <Link href="/auth/signup">
                    <Button className="rounded-full bg-[#18110d] px-5 text-white hover:bg-[#2d211c]">
                      {dictionary.landingClaimCta}
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#ddd0c6] bg-white/88 text-[#1f1814] lg:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        <AnimatePresence initial={false}>
          {mobileMenuOpen ? (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
            >
              <button
                type="button"
                className="absolute inset-0 bg-[#160f0b]/45 backdrop-blur-sm"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
              />
              <m.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-[#dfd1c6] bg-[#fbf6f2] p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <AppLogo />
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd0c6] bg-white"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="mt-10 space-y-2 text-base font-semibold text-[#2b221d]">
                  {[
                    { href: "#features", label: dictionary.landingNavFeatures },
                    { href: "#themes", label: dictionary.landingNavThemes },
                    { href: "#pricing", label: dictionary.landingNavPricing },
                    { href: "#faq", label: dictionary.landingNavFaq },
                  ].map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="block rounded-2xl border border-[#e7dbd2] bg-white px-4 py-3"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>

                <div className="mt-6">
                  <SitePreferences compact />
                </div>

                <div className="mt-auto space-y-3">
                  {currentUser ? (
                    <>
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="secondary" className="w-full rounded-full">
                          Dashboard
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full rounded-full"
                        onClick={async () => {
                          await supabase.auth.signOut();
                          window.location.replace("/");
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="secondary" className="w-full rounded-full">
                          {loginLabel}
                        </Button>
                      </Link>
                      <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full rounded-full bg-[#18110d] text-white hover:bg-[#2d211c]">
                          {dictionary.landingClaimCta}
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </m.aside>
            </m.div>
          ) : null}
        </AnimatePresence>

        <main className="pb-20">
          <section className="relative isolate overflow-hidden border-b border-[#d5c4b9] bg-[#130d09] text-white">
            <video
              className="absolute inset-0 h-full w-full object-cover opacity-40"
              src="/hero-loop.mp4"
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 18% 18%, rgba(239, 95, 73, 0.22), transparent 32%), radial-gradient(circle at 82% 22%, rgba(255, 209, 177, 0.16), transparent 30%), linear-gradient(135deg, rgba(14, 9, 6, 0.84), rgba(14, 9, 6, 0.56) 42%, rgba(14, 9, 6, 0.82))",
              }}
            />
            <div className="absolute left-0 top-0 h-full w-full bg-[linear-gradient(180deg,rgba(13,8,5,0.2),rgba(13,8,5,0.74))]" />

            <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-18 lg:pb-24 lg:pt-22">
              <div className="grid gap-12 lg:grid-cols-[minmax(0,1.04fr)_minmax(360px,0.96fr)] lg:items-center">
                <m.div {...getRevealProps(prefersReducedMotion)} className="max-w-2xl">
                  <Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffd2c5] shadow-none">
                    {dictionary.landingBadge}
                  </Badge>

                  <h1 className="mt-5 text-[2.8rem] font-bold leading-[0.96] tracking-[-0.05em] text-white sm:text-[4rem] lg:text-[5.3rem]">
                    {dictionary.landingHeroTitleLead}
                    <span className="mt-3 block font-accent text-[1.05em] text-[#ffaf94]">
                      {dictionary.landingHeroTitleAccent}
                    </span>
                  </h1>

                  <p className="mt-6 max-w-2xl text-base leading-8 text-white/82 sm:text-lg sm:leading-9">
                    {dictionary.landingDescription}
                  </p>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-white/66 sm:text-base sm:leading-8">
                    {dictionary.landingHeroDescription}
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <div className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur">
                      <span className="font-semibold text-white">{creatorCountLabel}</span>{" "}
                      {dictionary.statCreators}
                    </div>
                    <div className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur">
                      <span className="font-semibold text-white">{videoCountLabel}</span>{" "}
                      {locale === "en" ? "public videos" : "video publik"}
                    </div>
                    <div className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur">
                      <span className="font-semibold text-white">Mobile + Desktop</span>
                    </div>
                  </div>

                  <div className="mt-8 max-w-xl rounded-[1.75rem] border border-white/12 bg-white/10 p-3 shadow-[0_22px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
                    <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/62">
                      {dictionary.landingHeroInputHint}
                    </p>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (usernameStatus !== "available") {
                          return;
                        }
                        window.location.assign(
                          `/auth/signup?username=${encodeURIComponent(sanitizedUsername)}`
                        );
                      }}
                    >
                      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                        <label className="inline-flex h-12 items-center rounded-[1.05rem] border border-white/10 bg-[#f4ede7] px-4 text-sm font-semibold text-[#77655c]">
                          showreels.id/
                        </label>
                        <Input
                          value={usernameInput}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            const trimmed = nextValue.trim();
                            const valid = /^[a-zA-Z0-9_]{3,24}$/.test(trimmed);

                            setUsernameInput(nextValue);
                            setUsernameSuggestion("");
                            setUsernameAsyncStatus(valid ? "checking" : "idle");
                          }}
                          placeholder={dictionary.landingHeroInputPlaceholder}
                          className="h-12 border-white/10 bg-[#f4ede7] text-[1rem] text-[#1d1511] placeholder:text-[#9d8c82] focus:ring-[#f1b7aa]"
                        />
                        <Button
                          type="submit"
                          className="h-12 min-w-[132px] rounded-[1.05rem] bg-[#ef5f49] text-white hover:bg-[#e1513a]"
                          disabled={usernameStatus !== "available"}
                        >
                          {dictionary.landingHeroInputAction}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                    <p
                      className={cn(
                        "px-2 pt-3 text-sm leading-relaxed",
                        usernameStatus === "available"
                          ? "text-emerald-300"
                          : usernameStatus === "taken" || usernameStatus === "invalid"
                            ? "text-rose-300"
                            : "text-white/68"
                      )}
                    >
                      {statusLabel}
                      {usernameStatus === "taken" && usernameSuggestion
                        ? ` (${locale === "en" ? "Try" : "Coba"} @${usernameSuggestion})`
                        : ""}
                    </p>
                  </div>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link href={primaryCtaHref}>
                      <Button className="h-12 rounded-full bg-[#f4ede7] px-6 text-[#1a120e] hover:bg-white">
                        {primaryCtaLabel}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <a href="#features">
                      <Button
                        variant="ghost"
                        className="h-12 rounded-full border border-white/12 bg-white/8 px-6 text-white hover:bg-white/14"
                      >
                        {dictionary.landingNavFeatures}
                      </Button>
                    </a>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/72">
                    <div className="flex -space-x-2">
                      {featuredCreators.length > 0 ? (
                        featuredCreators.slice(0, 4).map((creator) => (
                          <AvatarBadge
                            key={creator.id}
                            name={creator.name || "Creator"}
                            avatarUrl={creator.image || ""}
                            size="sm"
                          />
                        ))
                      ) : (
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-semibold text-white">
                          SR
                        </span>
                      )}
                    </div>
                    <p>{locale === "en" ? "Used by active video creators" : "Dipakai creator video aktif"}</p>
                  </div>
                </m.div>

                <m.div
                  {...getRevealProps(prefersReducedMotion, 0.08)}
                  className="relative mx-auto w-full max-w-[520px] lg:ml-auto"
                >
                  <div className="absolute -left-8 top-12 hidden rounded-[1.4rem] border border-white/12 bg-white/10 p-4 shadow-xl backdrop-blur lg:block">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                      {locale === "en" ? "Live profile" : "Profil live"}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      showreels.id/{heroPreviewUsername}
                    </p>
                    <p className="mt-2 text-sm text-white/65">
                      {locale === "en" ? "Username preview updates instantly." : "Preview username berubah secara instan."}
                    </p>
                  </div>

                  <div className="absolute -right-6 bottom-10 hidden rounded-[1.4rem] border border-white/12 bg-[#f6efe8] p-4 text-[#1d1511] shadow-xl lg:block">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <TrendingUp className="h-4 w-4 text-[#dc563b]" />
                      {locale === "en" ? "Portfolio ready" : "Portfolio siap kirim"}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#5d5048]">
                      {locale === "en"
                        ? "Creator identity, top video, and public links stay in one frame."
                        : "Identitas creator, video utama, dan link publik tetap dalam satu frame."}
                    </p>
                  </div>

                  <div className="relative overflow-hidden rounded-[2.8rem] border border-white/12 bg-white/10 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.36)] backdrop-blur-sm">
                    <div className="rounded-[2.3rem] border border-white/12 bg-[#201511]/60 p-3">
                      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#ffb08c] via-[#ef815f] to-[#cf472f] px-5 pb-6 pt-9 text-[#20130f]">
                        <div className="absolute left-1/2 top-3 h-5 w-24 -translate-x-1/2 rounded-full bg-[#120c09]" />
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/40 bg-white/88">
                          <AvatarBadge
                            name={heroCreator?.name || "Creator Demo"}
                            avatarUrl={heroCreator?.image || ""}
                            size="lg"
                          />
                        </div>
                        <div className="mt-4 text-center">
                          <p className="text-[1.7rem] font-semibold tracking-[-0.03em] text-[#211511]">
                            {heroCreator?.name || "Creator Demo"}
                          </p>
                          <p className="text-sm text-[#604d45]">
                            @{heroCreator?.username || "creator.demo"}
                          </p>
                          <p className="mx-auto mt-2 max-w-[260px] text-sm leading-6 text-[#4a3831]">
                            {heroCreator?.bio?.trim() ||
                              (locale === "en"
                                ? "Public page for links, profile, and featured video."
                                : "Halaman publik untuk link, profil, dan video unggulan.")}
                          </p>
                        </div>

                        <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-white/28 bg-white/82 p-3 shadow-[0_14px_28px_rgba(32,16,11,0.16)]">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8e6a5d]">
                                {locale === "en" ? "Featured reel" : "Reel pilihan"}
                              </p>
                              <p className="mt-1 text-sm font-semibold leading-6 text-[#1f1713]">
                                {heroVideo?.title ||
                                  (locale === "en"
                                    ? "Latest creator showcase"
                                    : "Showcase creator terbaru")}
                              </p>
                            </div>
                            {heroVideoSourceMeta ? (
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                                  heroVideoSourceMeta.className
                                )}
                              >
                                {heroVideoSourceMeta.label}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-3 overflow-hidden rounded-[1rem] bg-[#efe3db]">
                            {heroVideoThumbnail ? (
                              <Image
                                src={heroVideoThumbnail}
                                alt={`Thumbnail ${heroVideo?.title || "video"}`}
                                width={720}
                                height={420}
                                className="aspect-video h-full w-full object-cover"
                                unoptimized
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex aspect-video items-center justify-center text-sm font-semibold text-[#7a655c]">
                                <span className="inline-flex items-center gap-2">
                                  <PlayCircle className="h-4 w-4 text-[#ef5f49]" />
                                  {locale === "en" ? "Video preview" : "Preview video"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 space-y-2.5">
                          {heroQuickLinks.map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center justify-between rounded-[1rem] border border-white/26 bg-white/84 px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8d6f64]">
                                  {item.label}
                                </p>
                                <p className="truncate text-sm font-semibold text-[#241814]">
                                  {item.value}
                                </p>
                              </div>
                              <span className="rounded-full bg-[#f4e8df] px-2.5 py-1 text-xs font-semibold text-[#795f54]">
                                Live
                              </span>
                            </div>
                          ))}
                        </div>

                        <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f4b43]">
                          showreels.id/{heroPreviewUsername}
                        </p>
                      </div>
                    </div>
                  </div>
                </m.div>
              </div>
            </div>
          </section>

          <section
            id="features"
            className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20"
          >
            <LandingSectionHeader
              badge={dictionary.landingFeaturesBadge}
              titleLead={dictionary.landingFeaturesTitleLead}
              titleAccent={dictionary.landingFeaturesTitleAccent}
              description={dictionary.landingFeaturesDescription}
            />

            <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <m.article
                {...getRevealProps(prefersReducedMotion)}
                className="overflow-hidden rounded-[2rem] border border-[#e5d6cc] bg-[#fffaf6] p-6 shadow-[0_22px_50px_rgba(34,23,18,0.08)] sm:p-8"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#956e5f]">
                      {locale === "en" ? "Creator workflow" : "Alur creator"}
                    </p>
                    <h3 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.03em] text-[#1d1511] sm:text-[2.2rem]">
                      {locale === "en"
                        ? "Keep profile identity and highlight video in one premium layout."
                        : "Satukan identitas profil dan video unggulan dalam satu layout premium."}
                    </h3>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#ead8ce] bg-white px-4 py-2 text-sm font-semibold text-[#463832]">
                    <Sparkles className="h-4 w-4 text-[#df5a3f]" />
                    {locale === "en" ? "Public page ready" : "Siap jadi public page"}
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-base leading-8 text-[#5d5048]">
                  {locale === "en"
                    ? "This landing keeps the same showreels promise: a cleaner link stack, stronger creator framing, and a public page that actually helps people explore your work."
                    : "Landing ini tetap menjaga janji utama showreels: susunan link yang lebih bersih, framing creator yang lebih kuat, dan public page yang benar-benar membantu orang menjelajahi karya kamu."}
                </p>

                <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                  <div className="rounded-[1.6rem] bg-[#1d1410] p-5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f4b6a3]">
                      {locale === "en" ? "Inside the profile" : "Di dalam profil"}
                    </p>
                    <div className="mt-5 space-y-3">
                      {[
                        locale === "en" ? "Custom links with better hierarchy" : "Custom link dengan hirarki yang lebih jelas",
                        locale === "en" ? "Featured video block with source badge" : "Blok video unggulan dengan badge sumber",
                        locale === "en" ? "Readable mobile-first creator layout" : "Layout creator mobile-first yang tetap rapi",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-3 rounded-[1rem] border border-white/10 bg-white/6 px-4 py-3"
                        >
                          <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#f4b6a3] text-[#1f1511]">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          <p className="text-sm leading-7 text-white/80">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-[#ead8ce] bg-white p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#956e5f]">
                          {locale === "en" ? "Featured video block" : "Blok video unggulan"}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-[#1c1511]">
                          {heroVideo?.title ||
                            (locale === "en" ? "Creator showcase video" : "Video showcase creator")}
                        </p>
                      </div>
                      <span className="rounded-full border border-[#eddcd2] bg-[#faf3ee] px-3 py-1 text-xs font-semibold text-[#755f55]">
                        {heroVideo?.durationLabel || (locale === "en" ? "Ready" : "Siap")}
                      </span>
                    </div>
                    <div className="mt-4 overflow-hidden rounded-[1.3rem] bg-[#efe2d8]">
                      {heroVideoThumbnail ? (
                        <Image
                          src={heroVideoThumbnail}
                          alt={`Thumbnail ${heroVideo?.title || "video"}`}
                          width={900}
                          height={520}
                          className="aspect-video h-full w-full object-cover"
                          unoptimized
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center text-sm font-semibold text-[#7f695f]">
                          <span className="inline-flex items-center gap-2">
                            <PlayCircle className="h-4 w-4 text-[#ef5f49]" />
                            {locale === "en" ? "Video preview" : "Preview video"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[1rem] border border-[#edded4] bg-[#f8f1eb] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7267]">
                          {locale === "en" ? "Creator" : "Creator"}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#251a16]">
                          {heroVideo?.author?.name || heroCreator?.name || "Creator"}
                        </p>
                      </div>
                      <div className="rounded-[1rem] border border-[#edded4] bg-[#f8f1eb] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7267]">
                          {locale === "en" ? "Output" : "Output"}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#251a16]">
                          {heroVideo?.outputType || "-"}
                        </p>
                      </div>
                      <div className="rounded-[1rem] border border-[#edded4] bg-[#f8f1eb] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7267]">
                          {locale === "en" ? "Public slug" : "Slug publik"}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-[#251a16]">
                          {heroVideo?.publicSlug || heroPreviewUsername}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </m.article>

              <div className="grid gap-4 sm:grid-cols-2">
                {marketingFeatures.map((item, index) => (
                  <m.article
                    key={item.title}
                    {...getRevealProps(prefersReducedMotion, 0.04 * index)}
                    className={cn(
                      "rounded-[1.7rem] border p-5 shadow-[0_20px_40px_rgba(34,23,18,0.06)] sm:p-6",
                      index === 1
                        ? "border-[#1e1410] bg-[#1c1410] text-white"
                        : "border-[#e7d8ce] bg-white text-[#201712]"
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-semibold uppercase tracking-[0.18em]",
                        index === 1 ? "text-[#f2bea9]" : "text-[#9a7363]"
                      )}
                    >
                      {item.tag}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold leading-8 tracking-[-0.02em]">
                      {item.title}
                    </h3>
                    <p
                      className={cn(
                        "mt-3 text-sm leading-7 sm:text-base",
                        index === 1 ? "text-white/74" : "text-[#5d5048]"
                      )}
                    >
                      {item.description}
                    </p>
                  </m.article>
                ))}
              </div>
            </div>
          </section>

          <section id="themes" className="border-y border-[#e4d7cd] bg-[#fbf6f1] py-16 sm:py-20">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
              <LandingSectionHeader
                badge={dictionary.landingThemesBadge}
                titleLead={dictionary.landingThemesTitleLead}
                titleAccent={dictionary.landingThemesTitleAccent}
                description={dictionary.landingThemesDescription}
                center
              />

              <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {themePresets.map((theme, index) => (
                  <m.article
                    key={theme.name}
                    {...getRevealProps(prefersReducedMotion, 0.04 * index)}
                    className={cn(
                      "rounded-[2.1rem] border-[7px] border-[#17110d] bg-gradient-to-b p-4 shadow-[0_26px_54px_rgba(35,23,18,0.12)]",
                      theme.style.frame
                    )}
                  >
                    <div className="mx-auto mb-4 h-3 w-20 rounded-full bg-black/90" />
                    <div className={cn("rounded-[1.45rem] border px-4 py-4", theme.style.shell)}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70">
                        {dictionary.landingThemesBadge}
                      </p>
                      <p className="mt-2 text-lg font-semibold leading-tight">{theme.name}</p>
                      <p className="mt-1 text-xs opacity-75">{theme.handle}</p>
                      <p className="mt-3 text-sm leading-6 opacity-85">{theme.summary}</p>
                    </div>
                    <div className="mt-4 space-y-2.5">
                      {theme.featureHighlights.map((item) => (
                        <div
                          key={item}
                          className={cn(
                            "rounded-[1rem] border border-white/24 px-3 py-2.5 text-sm font-medium",
                            theme.style.chip
                          )}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </m.article>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <a href="#pricing">
                  <Button variant="secondary" className="rounded-full px-6">
                    {dictionary.landingThemesCta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </section>

          <section id="pricing" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <LandingSectionHeader
              badge={dictionary.landingPricingBadge}
              titleLead={dictionary.landingPricingTitleLead}
              titleAccent={dictionary.landingPricingTitleAccent}
              description={dictionary.landingPricingDescription}
              center
            />

            <div className="mt-10 grid gap-4 lg:grid-cols-3 lg:items-start">
              {pricingPlans.map((plan, index) => (
                <m.article
                  key={plan.name}
                  {...getRevealProps(prefersReducedMotion, 0.05 * index)}
                  className={cn(
                    "rounded-[1.9rem] border p-6 shadow-[0_24px_50px_rgba(34,23,18,0.08)] sm:p-7",
                    plan.featured
                      ? "border-[#1e1510] bg-[#1d1410] text-white lg:-translate-y-3"
                      : "border-[#e5d6cc] bg-white text-[#201712]"
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p
                        className={cn(
                          "text-xs font-semibold uppercase tracking-[0.18em]",
                          plan.featured ? "text-[#f6baa5]" : "text-[#9a7363]"
                        )}
                      >
                        {plan.name}
                      </p>
                      <p className="mt-2 text-5xl font-bold tracking-[-0.04em]">
                        {plan.price}
                      </p>
                      <p
                        className={cn(
                          "mt-3 text-sm leading-7",
                          plan.featured ? "text-white/76" : "text-[#5d5048]"
                        )}
                      >
                        {plan.subtitle}
                      </p>
                    </div>
                    {plan.featured ? (
                      <span className="rounded-full bg-[#f4baa5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2a160f]">
                        {locale === "en" ? "Most picked" : "Paling dipilih"}
                      </span>
                    ) : null}
                  </div>

                  <ul className="mt-7 space-y-3">
                    {plan.points.map((point) => (
                      <li key={point} className="flex items-center gap-3 text-sm sm:text-base">
                        <span
                          className={cn(
                            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                            plan.featured
                              ? "bg-white/10 text-[#f6baa5]"
                              : "bg-[#fff0e8] text-[#dc563b]"
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7">
                    <Link href="/auth/signup">
                      <Button
                        className={cn(
                          "w-full rounded-full",
                          plan.featured
                            ? "bg-[#f3ece5] text-[#1d1410] hover:bg-white"
                            : "bg-[#1d1410] text-white hover:bg-[#30231d]"
                        )}
                      >
                        {locale === "en" ? "Choose plan" : "Pilih paket"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </m.article>
              ))}
            </div>
          </section>

          <section className="border-y border-[#e6d9cf] bg-[#fbf6f2] py-16 sm:py-20">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
              <LandingSectionHeader
                badge={dictionary.landingTestimonialsBadge}
                titleLead={dictionary.landingTestimonialsTitleLead}
                titleAccent={dictionary.landingTestimonialsTitleAccent}
                description={dictionary.landingTestimonialsDescription}
                center
              />

              <div className="mt-10 grid gap-4 lg:grid-cols-3">
                {marketingTestimonials.map((item, index) => (
                  <m.article
                    key={item.name}
                    {...getRevealProps(prefersReducedMotion, 0.04 * index)}
                    className={cn(
                      "rounded-[1.8rem] border p-6 sm:p-7",
                      item.light
                        ? "border-[#e3d5cc] bg-white text-[#221914]"
                        : "border-[#221611] bg-[#1b120e] text-white"
                    )}
                  >
                    <p className={cn("text-lg leading-9", item.light ? "text-[#3d302a]" : "text-white/90")}>
                      &ldquo;{item.quote}&rdquo;
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex h-11 w-11 items-center justify-center rounded-full text-base font-semibold",
                          item.light
                            ? "bg-gradient-to-br from-[#f1ab96] to-[#eb5e47] text-white"
                            : "bg-gradient-to-br from-[#f0c59a] to-[#b87639] text-white"
                        )}
                      >
                        {item.name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-lg font-semibold">{item.name}</p>
                        <p
                          className={cn(
                            "text-sm",
                            item.light ? "text-[#776860]" : "text-white/65"
                          )}
                        >
                          {item.role}
                        </p>
                      </div>
                    </div>
                  </m.article>
                ))}
              </div>
            </div>
          </section>

          <section id="faq" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
              <m.div {...getRevealProps(prefersReducedMotion)}>
                <LandingSectionHeader
                  badge={dictionary.landingFaqBadge}
                  titleLead={dictionary.landingFaqTitleLead}
                  titleAccent={dictionary.landingFaqTitleAccent}
                  description={dictionary.landingFaqDescription}
                />

                <div className="mt-8 rounded-[1.7rem] border border-[#e4d7cd] bg-[#fbf4ee] p-6">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0e8] text-[#dd593e]">
                      <Users className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#976f60]">
                        {locale === "en" ? "Built for creators" : "Dibuat untuk creator"}
                      </p>
                      <p className="mt-2 text-base leading-8 text-[#5d5048]">
                        {locale === "en"
                          ? "The FAQ stays focused on how Showreels helps creators present work clearly and professionally."
                          : "FAQ ini tetap fokus pada bagaimana Showreels membantu creator menampilkan karya secara jelas dan profesional."}
                      </p>
                    </div>
                  </div>
                </div>
              </m.div>

              <m.div
                {...getRevealProps(prefersReducedMotion, 0.05)}
                className="rounded-[1.9rem] border border-[#e2d5cc] bg-white px-6 shadow-[0_22px_50px_rgba(34,23,18,0.06)] sm:px-8"
              >
                {marketingFaqItems.map((item, index) => (
                  <LandingFaqItem
                    key={item.question}
                    question={item.question}
                    answer={item.answer}
                    open={openFaqIndex === index}
                    onToggle={() => setOpenFaqIndex((prev) => (prev === index ? -1 : index))}
                  />
                ))}
              </m.div>
            </div>
          </section>

          <section className="border-y border-[#e4d7ce] bg-[#f9f3ed] py-16 sm:py-20">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f6d5f]">
                    Community
                  </p>
                  <h2 className="mt-3 text-[2rem] font-bold leading-[1.04] tracking-[-0.04em] text-[#18120f] sm:text-[2.9rem]">
                    {locale === "en" ? "Featured creators" : "Creator pilihan"}
                  </h2>
                  <p className="mt-3 text-base leading-8 text-[#5d5048] sm:text-lg">
                    {locale === "en"
                      ? "Real creator profiles stay visible in the redesign so the page still feels alive."
                      : "Profil creator sungguhan tetap tampil di desain baru agar landing tetap terasa hidup."}
                  </p>
                </div>
                <div className="rounded-full border border-[#e5d6cc] bg-white px-4 py-2 text-sm font-semibold text-[#4b3d36]">
                  {creatorCountLabel} {locale === "en" ? "creators active" : "creator aktif"}
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {featuredCreatorCards.length === 0 ? (
                  <p className="rounded-[1.7rem] border border-dashed border-[#d9cbc2] bg-white p-8 text-center text-sm text-[#6d6159] md:col-span-2 xl:col-span-3">
                    {locale === "en" ? "No creators yet." : "Belum ada creator."}
                  </p>
                ) : (
                  featuredCreatorCards.map((creator, index) => (
                    <m.div key={creator.id} {...getRevealProps(prefersReducedMotion, 0.04 * index)}>
                      <Link
                        href={creator.username ? `/creator/${creator.username}` : "/auth/signup"}
                        className="group block h-full rounded-[1.8rem] border border-[#e2d4ca] bg-white p-5 shadow-[0_20px_44px_rgba(34,23,18,0.06)] transition hover:-translate-y-1"
                      >
                        <div className="flex items-center gap-3">
                          <AvatarBadge
                            name={creator.name || "Creator"}
                            avatarUrl={creator.image || ""}
                            size="md"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-lg font-semibold text-[#201712]">
                              {creator.name || "Creator"}
                            </p>
                            <p className="truncate text-sm text-[#7b6b63]">
                              @{creator.username || "creator"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 rounded-[1.3rem] bg-[#fbf4ee] p-4">
                          <p className="line-clamp-3 text-sm leading-7 text-[#564942]">
                            {creator.bio?.trim() ||
                              (locale === "en"
                                ? "Bio has not been added yet."
                                : "Bio belum ditambahkan.")}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-sm text-[#7b6b63]">
                          <span>{creator.city || (locale === "en" ? "Indonesia" : "Indonesia")}</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-[#2a1d17]">
                            {locale === "en" ? "Open profile" : "Buka profil"}
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </Link>
                    </m.div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f6d5f]">
                  {dictionary.featuredVideos}
                </p>
                <h2 className="mt-3 text-[2rem] font-bold leading-[1.04] tracking-[-0.04em] text-[#18120f] sm:text-[2.9rem]">
                  {locale === "en"
                    ? "Latest videos from creators"
                    : "Video terbaru dari creator"}
                </h2>
                <p className="mt-3 text-base leading-8 text-[#5d5048] sm:text-lg">
                  {locale === "en"
                    ? "The landing still surfaces fresh work, not just decorative mockups."
                    : "Landing tetap menampilkan karya terbaru, bukan hanya mockup dekoratif."}
                </p>
              </div>

              <div className="inline-flex items-center gap-1 rounded-full border border-[#ddd0c7] bg-white p-1">
                <button
                  type="button"
                  onClick={() => setLatestVideosView("grid")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition",
                    latestVideosView === "grid"
                      ? "bg-[#1d1410] text-white"
                      : "text-[#5d5049] hover:bg-[#f3ece7]"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setLatestVideosView("list")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition",
                    latestVideosView === "list"
                      ? "bg-[#1d1410] text-white"
                      : "text-[#5d5049] hover:bg-[#f3ece7]"
                  )}
                >
                  <List className="h-4 w-4" />
                  List
                </button>
              </div>
            </div>

            <div
              className={cn(
                "mt-8",
                latestVideosView === "grid"
                  ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                  : "space-y-4"
              )}
            >
              {visibleLatestVideos.length === 0 ? (
                <p className="rounded-[1.7rem] border border-dashed border-[#d9cbc2] bg-white p-8 text-center text-sm text-[#6d6159]">
                  {locale === "en" ? "No video yet." : "Belum ada video."}
                </p>
              ) : (
                visibleLatestVideos.map((video, index) => {
                  const thumbnail =
                    getThumbnailCandidates(video.sourceUrl, video.thumbnailUrl)[0] || "";
                  const sourceMeta = getVideoSourceBadgeMeta(video.sourceUrl);
                  const postedDateLabel = new Intl.DateTimeFormat(localeCode, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(video.createdAt));

                  return (
                    <m.div key={video.id} {...getRevealProps(prefersReducedMotion, 0.04 * index)}>
                      <Link
                        href={`/v/${video.publicSlug}`}
                        className={cn(
                          "group block overflow-hidden rounded-[1.8rem] border border-[#e3d5cb] bg-white p-4 shadow-[0_22px_48px_rgba(34,23,18,0.06)] transition hover:-translate-y-1 sm:p-5",
                          latestVideosView === "list"
                            ? "grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]"
                            : "flex h-full flex-col"
                        )}
                      >
                        <div className="overflow-hidden rounded-[1.3rem] bg-[#efe4db]">
                          {thumbnail ? (
                            <Image
                              src={thumbnail}
                              alt={`Thumbnail ${video.title}`}
                              width={440}
                              height={248}
                              className="aspect-video h-full w-full object-cover"
                              unoptimized
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex aspect-video items-center justify-center text-sm font-medium text-[#6f625a]">
                              <span className="inline-flex items-center gap-1">
                                <PlayCircle className="h-4 w-4 text-[#ef5f49]" />
                                Video
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex min-w-0 flex-1 flex-col gap-3 sm:mt-0">
                          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                            <p className="line-clamp-2 min-w-0 flex-1 text-[1rem] font-semibold leading-7 text-[#1f1a17] sm:text-[1.05rem]">
                              {video.title}
                            </p>
                            <span
                              className={cn(
                                "mt-0.5 inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs",
                                sourceMeta.className
                              )}
                            >
                              {sourceMeta.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <AvatarBadge
                              name={video.author?.name || "Creator"}
                              avatarUrl={video.author?.image || ""}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#4a3d37]">
                                {video.author?.name || "Creator"}
                              </p>
                              <p className="truncate text-xs text-[#7d6e66]">
                                @{video.author?.username || "creator"}
                              </p>
                            </div>
                          </div>

                          <p className="line-clamp-2 text-sm leading-7 text-[#5f524b]">
                            {video.description}
                          </p>

                          <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#e7ddd7] pt-3 text-xs text-[#6f625a]">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-[#f6eee9] px-2.5 py-1">
                                {video.durationLabel || "-"}
                              </span>
                              <span className="rounded-full bg-[#f6eee9] px-2.5 py-1">
                                {video.outputType || "-"}
                              </span>
                            </div>
                            <span>{postedDateLabel}</span>
                          </div>
                        </div>
                      </Link>
                    </m.div>
                  );
                })
              )}
            </div>

            <div className="mt-8">
              <Link href="/videos">
                <Button variant="secondary" className="rounded-full px-6">
                  {locale === "en" ? "View all videos" : "Lihat semua video"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <m.div
              {...getRevealProps(prefersReducedMotion)}
              className="overflow-hidden rounded-[2.2rem] border border-[#2e201a] bg-[#1a120f] px-6 py-8 text-white shadow-[0_30px_80px_rgba(24,16,12,0.28)] sm:px-8 sm:py-10"
            >
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f4baa5]">
                    Ready
                  </p>
                  <h2 className="mt-3 text-[2.1rem] font-bold leading-[1.02] tracking-[-0.04em] sm:text-[3.2rem]">
                    {locale === "en"
                      ? "Build a creator page that looks ready before the brand asks."
                      : "Bangun halaman creator yang sudah terlihat siap sebelum brand minta."}
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
                    {locale === "en"
                      ? "Showreels keeps profile, links, and public videos in a single page that feels cleaner, sharper, and easier to share."
                      : "Showreels menjaga profil, link, dan video publik dalam satu halaman yang terasa lebih rapi, tajam, dan mudah dibagikan."}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href={primaryCtaHref}>
                    <Button className="h-12 rounded-full bg-[#f3ece5] px-6 text-[#19120f] hover:bg-white">
                      {primaryCtaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href="#themes">
                    <Button
                      variant="ghost"
                      className="h-12 rounded-full border border-white/12 bg-white/6 px-6 text-white hover:bg-white/12"
                    >
                      {dictionary.landingNavThemes}
                    </Button>
                  </a>
                </div>
              </div>
            </m.div>
          </section>
        </main>

        <footer className="mt-16 border-t border-[#e3d6cd] bg-[#f7f0e9]">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div>
              <AppLogo />
              <p className="mt-4 max-w-md text-sm leading-7 text-[#5f524b]">
                {locale === "en"
                  ? "showreels.id helps creators present their best work through public pages that feel cleaner and more client-ready."
                  : "showreels.id membantu creator menampilkan karya terbaik lewat public page yang terasa lebih rapi dan siap dilihat klien."}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#211b17]">Company</p>
              <div className="mt-3 space-y-2 text-sm text-[#5f524b]">
                <Link href="/about" className="block transition hover:text-[#1e1814]">
                  About
                </Link>
                <Link href="/auth/signup" className="block transition hover:text-[#1e1814]">
                  Register Creator
                </Link>
                <Link href="/dashboard" className="block transition hover:text-[#1e1814]">
                  Dashboard
                </Link>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#211b17]">Support</p>
              <div className="mt-3 space-y-2 text-sm text-[#5f524b]">
                <Link
                  href="/customer-service"
                  className="block transition hover:text-[#1e1814]"
                >
                  Customer Service
                </Link>
                <Link href="/auth/login" className="block transition hover:text-[#1e1814]">
                  Login
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-[#e4dbd5]">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 text-sm text-[#7d6f67] sm:px-6">
              <p>Copyright {year} showreels.id. All rights reserved.</p>
              <p className="hidden items-center gap-1 sm:inline-flex">
                <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                Creator-first platform
              </p>
            </div>
          </div>
        </footer>
      </div>
    </LazyMotion>
  );
}
