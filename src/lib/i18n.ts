export const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];

export const dictionaries = {
  id: {
    language: "Bahasa",
    home: "Beranda",
    login: "Masuk",
    signup: "Daftar",
    dashboard: "Dashboard",
    profile: "Profil",
    submitVideo: "Submit Video",
    logout: "Keluar",
    exploreCreator: "Lihat profil kreator",
    publicProfile: "Profil Publik",
    landingBadge: "Creator Portfolio Platform",
    landingTitle: "Tampilkan karya video terbaikmu dalam halaman yang terasa premium.",
    landingDescription:
      "showreels.id membantu kreator, editor, dan videografer membuat profil profesional, menyimpan video ke database, lalu membagikannya lewat public page yang mudah dijelajahi klien.",
    landingCtaPrimary: "Mulai Bangun Portfolio",
    landingCtaSecondary: "Masuk ke Dashboard",
    landingNavFeatures: "Fitur",
    landingNavThemes: "Tema",
    landingNavPricing: "Harga",
    landingNavFaq: "FAQ",
    landingClaimCta: "Claim @kamu",
    landingHeroBadge: "Baru",
    landingHeroTitleLead: "Satu tautan.",
    landingHeroTitleAccent: "Semua karya videomu.",
    landingHeroDescription:
      "Bikin halaman creator yang merepresentasikan dirimu dalam hitungan menit. Kelola semua link dan karya dalam satu tempat yang gampang diingat.",
    landingHeroInputHint: "Cek username kamu sekarang",
    landingHeroInputPlaceholder: "nama_kamu",
    landingHeroInputAction: "Ambil",
    landingHeroStatusIdle: "Cek ketersediaan username secara live.",
    landingHeroStatusChecking: "Mengecek username...",
    landingHeroStatusAvailable: "Username bagus masih tersedia.",
    landingHeroStatusTaken: "Username sudah dipakai creator lain.",
    landingHeroStatusInvalid: "Gunakan 3-24 karakter: huruf, angka, underscore.",
    landingThemesBadge: "Tema",
    landingThemesTitleLead: "Tampilan yang",
    landingThemesTitleAccent: "mencerminkan kamu",
    landingThemesDescription:
      "Pilih dari beragam tema premium atau custom sesuai brandmu tanpa menulis satu baris kode pun.",
    landingThemesCta: "Lihat semua tema",
    landingFeaturesBadge: "Simpel",
    landingFeaturesTitleLead: "Bio page yang",
    landingFeaturesTitleAccent: "benar-benar memudahkan.",
    landingFeaturesDescription:
      "Setup 2 menit, update kapan pun dari HP. Tanpa coding, tanpa ribet.",
    landingPricingBadge: "Harga",
    landingPricingTitleLead: "Paket fleksibel untuk",
    landingPricingTitleAccent: "creator yang berkembang.",
    landingPricingDescription:
      "Mulai gratis, upgrade saat butuh fitur lebih lanjut.",
    landingPricingFree: "Gratis selamanya",
    landingPricingPro: "Untuk creator aktif",
    landingPricingTeam: "Untuk tim & agency",
    landingTestimonialsBadge: "Testimoni",
    landingTestimonialsTitleLead: "Dari creator,",
    landingTestimonialsTitleAccent: "untuk creator.",
    landingTestimonialsDescription:
      "Creator Indonesia dari berbagai niche sudah membuktikan satu link yang rapi bisa meningkatkan kepercayaan klien.",
    landingFaqBadge: "FAQ",
    landingFaqTitleLead: "Ada",
    landingFaqTitleAccent: "pertanyaan?",
    landingFaqDescription:
      "Jawaban singkat untuk pertanyaan yang paling sering muncul.",
    statCreators: "Kreator aktif",
    statVideos: "Video tersimpan",
    statProfiles: "Profil publik siap dibagikan",
    featuredCreators: "Kreator Pilihan",
    featuredVideos: "Video Terbaru",
    authLoginTitle: "Masuk ke akunmu",
    authLoginSubtitle:
      "Gunakan email dan password, atau langsung lanjut dengan akun Google.",
    authSignupTitle: "Buat akun kreator",
    authSignupSubtitle:
      "Daftar sekali, lalu kelola profil dan video portfolio dari dashboard.",
    continueGoogle: "Lanjut dengan Google",
    noAccount: "Belum punya akun?",
    hasAccount: "Sudah punya akun?",
    welcomeBack: "Selamat datang kembali,",
    myVideos: "Video Portofolio Saya",
    editProfile: "Edit Profil",
    publishVideo: "Publikasikan video",
    profileWillShow: "Data ini tampil di halaman profil publik dan halaman video.",
    publicLinkReady: "Link publik siap dibagikan",
    creatorProfile: "Profil kreator",
    availableVideos: "Video yang sudah dipublikasikan",
    noVideosYet: "Belum ada video yang dipublikasikan.",
  },
  en: {
    language: "Language",
    home: "Home",
    login: "Login",
    signup: "Sign up",
    dashboard: "Dashboard",
    profile: "Profile",
    submitVideo: "Submit Video",
    logout: "Logout",
    exploreCreator: "View creator profile",
    publicProfile: "Public Profile",
    landingBadge: "Creator Portfolio Platform",
    landingTitle: "Showcase your best video work on a premium-feeling public site.",
    landingDescription:
      "showreels.id helps creators, editors, and videographers build a professional profile, save videos to a real database, and share them through public pages clients can explore easily.",
    landingCtaPrimary: "Start Building Your Portfolio",
    landingCtaSecondary: "Go to Dashboard",
    landingNavFeatures: "Features",
    landingNavThemes: "Themes",
    landingNavPricing: "Pricing",
    landingNavFaq: "FAQ",
    landingClaimCta: "Claim your @name",
    landingHeroBadge: "New",
    landingHeroTitleLead: "One link.",
    landingHeroTitleAccent: "All your video work.",
    landingHeroDescription:
      "Build a creator page that reflects your style in minutes. Keep your links and top work in one memorable place.",
    landingHeroInputHint: "Check your username now",
    landingHeroInputPlaceholder: "your_name",
    landingHeroInputAction: "Claim",
    landingHeroStatusIdle: "Check username availability in real-time.",
    landingHeroStatusChecking: "Checking username...",
    landingHeroStatusAvailable: "Great username is still available.",
    landingHeroStatusTaken: "This username is already taken.",
    landingHeroStatusInvalid: "Use 3-24 characters: letters, numbers, underscore.",
    landingThemesBadge: "Themes",
    landingThemesTitleLead: "A look that",
    landingThemesTitleAccent: "feels like you",
    landingThemesDescription:
      "Pick from premium themes or customize to match your brand without writing any code.",
    landingThemesCta: "View all themes",
    landingFeaturesBadge: "Simple",
    landingFeaturesTitleLead: "A bio page that",
    landingFeaturesTitleAccent: "actually helps.",
    landingFeaturesDescription:
      "Set up in minutes, update from your phone anytime. No coding required.",
    landingPricingBadge: "Pricing",
    landingPricingTitleLead: "Flexible plans for",
    landingPricingTitleAccent: "growing creators.",
    landingPricingDescription:
      "Start free and upgrade whenever you need more control.",
    landingPricingFree: "Free forever",
    landingPricingPro: "For active creators",
    landingPricingTeam: "For teams & agencies",
    landingTestimonialsBadge: "Testimonials",
    landingTestimonialsTitleLead: "From creators,",
    landingTestimonialsTitleAccent: "to creators.",
    landingTestimonialsDescription:
      "Creators across niches prove that one polished link builds stronger client trust.",
    landingFaqBadge: "FAQ",
    landingFaqTitleLead: "Any",
    landingFaqTitleAccent: "questions?",
    landingFaqDescription:
      "Quick answers to the most common questions.",
    statCreators: "Active creators",
    statVideos: "Stored videos",
    statProfiles: "Share-ready public profiles",
    featuredCreators: "Featured Creators",
    featuredVideos: "Latest Videos",
    authLoginTitle: "Sign in to your account",
    authLoginSubtitle:
      "Use your email and password, or continue instantly with Google.",
    authSignupTitle: "Create your creator account",
    authSignupSubtitle:
      "Sign up once, then manage your profile and portfolio videos from the dashboard.",
    continueGoogle: "Continue with Google",
    noAccount: "Don't have an account yet?",
    hasAccount: "Already have an account?",
    welcomeBack: "Welcome back,",
    myVideos: "My Portfolio Videos",
    editProfile: "Edit Profile",
    publishVideo: "Publish video",
    profileWillShow:
      "This information appears on your public profile and video pages.",
    publicLinkReady: "Public link ready to share",
    creatorProfile: "Creator profile",
    availableVideos: "Published videos",
    noVideosYet: "No videos have been published yet.",
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function resolveLocale(input?: string | null): Locale {
  if (input === "en") {
    return "en";
  }
  return "id";
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
