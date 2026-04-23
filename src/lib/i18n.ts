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
