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
    landingBadge: "Platform Portfolio Video Creator",
    landingTitle: "Satu halaman publik untuk profil creator dan karya video terbaik.",
    landingDescription:
      "showreels.id membantu creator menata profil publik, custom links, social/contact links, dan halaman video publik dalam satu tempat yang siap dibagikan.",
    landingCtaPrimary: "Mulai Bangun Portfolio",
    landingCtaSecondary: "Masuk ke Dashboard",
    landingNavFeatures: "Fitur",
    landingNavThemes: "Tema",
    landingNavPricing: "Harga",
    landingNavFaq: "FAQ",
    landingClaimCta: "Claim",
    landingHeroBadge: "Platform Portofolio",
    landingHeroTitleLead: "Satu link.",
    landingHeroTitleAccent: "Karya videomu.",
    landingHeroDescription:
      "Tampilkan identitas, keahlian, dan karya video terbaikmu dalam satu halaman publik yang profesional dan siap dibagikan.",
    landingHeroInputHint: "Cek username kamu sekarang",
    landingHeroInputPlaceholder: "nama_kamu",
    landingHeroInputAction: "Ambil",
    landingHeroStatusIdle: "Cek ketersediaan username secara live.",
    landingHeroStatusChecking: "Mengecek username...",
    landingHeroStatusAvailable: "Username bagus masih tersedia.",
    landingHeroStatusTaken: "Username sudah dipakai creator lain.",
    landingHeroStatusInvalid: "Gunakan 3-24 karakter: huruf, angka, underscore.",
    landingThemesBadge: "Tema",
    landingThemesTitleLead: "Tema tampilan",
    landingThemesTitleAccent: "profil & video",
    landingThemesDescription:
      "Pilihan tampilan untuk halaman profil dan video kamu.",
    landingThemesCta: "Tema",
    landingThemesPresetStarter: "Creator Clean",
    landingThemesPresetCampaign: "Portfolio Warm",
    landingThemesPresetStudio: "Studio Focus",
    landingThemesPresetPersonal: "Editorial Soft",
    landingThemesPresetAgency: "Minimal Contrast",
    landingThemesFeatureCustomLinks: "Link utama",
    landingThemesFeatureSocialLinks: "Kontak",
    landingThemesFeatureVideoHighlight: "Video baru",
    landingThemesFeatureContact: "Profil rapi",
    landingThemesFeatureVisibility: "Info visibilitas konten",
    landingThemesFeaturePortfolio: "Katalog karya konsisten",
    landingFeaturesBadge: "Fitur Aktual",
    landingFeaturesTitleLead: "Fitur penting",
    landingFeaturesTitleAccent: "untuk creator video.",
    landingFeaturesDescription:
      "Profil publik, halaman video, custom link, dan kontrol visibilitas — semua dikelola dari dashboard.",
    landingPlatformBadge: "Platform",
    landingPlatformTitleLead: "Sumber video yang",
    landingPlatformTitleAccent: "didukung Showreels",
    landingPlatformDescription:
      "Hubungkan video dari platform yang sudah kamu gunakan, lalu tampilkan di halaman portfolio.",
    landingPricingBadge: "Harga",
    landingPricingTitleLead: "Paket simpel untuk",
    landingPricingTitleAccent: "creator hebat.",
    landingPricingDescription:
      "Pilih paket sesuai kebutuhanmu. Proses checkout cepat dan sederhana.",
    landingPricingMonthlyLabel: "Bulanan",
    landingPricingYearlyLabel: "Tahunan",
    landingPricingYearlySave: "Hemat 2 bulan",
    landingPricingFree: "Mulai profil publik personal",
    landingPricingCreator: "Kontrol dan kapasitas lebih untuk creator aktif",
    landingPricingTeam: "Cocok untuk studio dan agency",
    landingTestimonialsBadge: "Testimoni",
    landingTestimonialsTitleLead: "Dari creator,",
    landingTestimonialsTitleAccent: "untuk creator.",
    landingTestimonialsDescription:
      "Pengalaman creator yang menggunakan Showreels untuk menampilkan karya terbaik mereka.",
    landingFaqBadge: "FAQ",
    landingFaqTitleLead: "Ada",
    landingFaqTitleAccent: "pertanyaan?",
    landingFaqDescription:
      "Jawaban singkat untuk pertanyaan yang sering diajukan.",
    landingFinalBadge: "Siap mulai?",
    landingFinalTitleLead: "Siap mengembangkan",
    landingFinalTitleAccent: "portfolio digital",
    landingFinalTitleTail: "kamu?",
    landingFinalDescription:
      "Mulai sekarang. Gratis, tanpa kartu kredit.",
    landingFinalPrimaryCta: "Mulai",
    landingFinalSecondaryCta: "Demo",
    landingFinalPointFast: "Setup 2 menit",
    landingFinalPointFree: "Tanpa kartu kredit",
    landingFinalPointFlexible: "Ubah kapan saja",
    statCreators: "Kreator aktif",
    statVideos: "Video tersimpan",
    statProfiles: "Profil publik siap dibagikan",
    welcomeBack: "Selamat datang kembali,",
    myVideos: "Video Portofolio Saya",
    editProfile: "Edit Profil",
    publishVideo: "Publikasikan video",
    profileWillShow: "Data ini tampil di halaman profil publik dan halaman video.",
    publicLinkReady: "Link publik siap dibagikan",
    creatorProfile: "Profil kreator",
    availableVideos: "Video yang sudah dipublikasikan",
    noVideosYet: "Belum ada video yang dipublikasikan.",
    profileCustomLinksTitle: "Custom Links",
    profileCustomLinksDescription:
      "Tambahkan link utama yang ingin kamu sorot di halaman publik creator.",
    profileCustomLinksAdd: "Tambah link",
    profileCustomLinksLimit: "Maksimal {max} custom link per creator.",
    profileCustomLinksEmpty:
      "Belum ada custom link. Tambahkan link utama seperti media kit, toko, atau booking.",
    profileCustomLinksLabel: "Link",
    profileCustomLinksNamePlaceholder: "Nama link (contoh: Media Kit)",
    profileCustomLinksUrlPlaceholder: "https://link-kamu.com",
    profileCustomLinksMoveUp: "Naikkan urutan",
    profileCustomLinksMoveDown: "Turunkan urutan",
    profileCustomLinksRemove: "Hapus link",
    profileCustomLinksToggle: "Tampilkan link ini di halaman publik",
    publicPrimaryLinksTitle: "Link Utama",
    landingHowItWorksBadge: "Cara Kerja",
    landingHowItWorksTitleLead: "Fast &",
    landingHowItWorksTitleAccent: "Easy",
    landingHowItWorksDescription: "Mulai gunakan Showreels dalam 3 langkah sederhana dan cepat.",
    landingHowItWorksStep1Label: "Langkah 1",
    landingHowItWorksStep1Title: "Pilih paket & daftar",
    landingHowItWorksStep1Description: "Pilih paket yang cocok, lalu daftar dengan email atau Google dalam hitungan menit.",
    landingHowItWorksStep2Label: "Langkah 2",
    landingHowItWorksStep2Title: "Upload video kamu",
    landingHowItWorksStep2Description: "Hubungkan video dari YouTube, Drive, Instagram, Vimeo, atau Facebook ke portfolio kamu.",
    landingHowItWorksStep3Label: "Langkah 3",
    landingHowItWorksStep3Title: "Publikasikan & bagikan",
    landingHowItWorksStep3Description: "Atur visibilitas, publikasikan karya, dan bagikan link profil kamu.",
    landingBenefitStrip1: "Profil publik siap dibagikan",
    landingBenefitStrip2: "Video dari 5 platform",
    landingBenefitStrip3: "Kontrol visibilitas penuh",
    landingBenefitStrip4: "Custom link & kontak",
    landingValuePropBadge: "Kenapa Showreels",
    landingValuePropTitle: "Satu halaman.",
    landingValuePropAccent: "Semua karya.",
    landingValuePropBody: "Creator video butuh tempat yang rapi untuk menampilkan identitas, keahlian, dan karya terbaik mereka — bukan tersebar di banyak platform.",
    landingProblemBadge: "Masalah",
    landingProblemTitle: "Karya kamu tersebar di mana-mana",
    landingProblemItem1: "Link video di berbagai platform berbeda",
    landingProblemItem2: "Tidak ada satu halaman profil yang profesional",
    landingProblemItem3: "Sulit mengontrol siapa yang bisa melihat apa",
    landingProblemItem4: "Proses review klien jadi lambat dan tidak efisien",
    landingSolutionBadge: "Solusi",
    landingSolutionTitle: "Satu halaman yang mengerjakan semuanya",
    landingSolutionItem1: "Profil publik dengan bio, keahlian, dan kontak",
    landingSolutionItem2: "Video dari YouTube, Drive, Instagram, Vimeo, Facebook",
    landingSolutionItem3: "Kontrol visibilitas: draft, private, semi-private, public",
    landingSolutionItem4: "Custom link prioritas untuk media kit, booking, dan lainnya",
    landingCreatorsTitle: "Creator yang sudah bergabung",
    landingCreatorsEmpty: "Jadilah yang pertama bergabung.",

    // === AUTH — LOGIN ===
    authLoginTitle: "Masuk ke Showreels",
    authLoginSubtitle:
      "Akses dashboard dan kelola portofolio video kamu dalam satu tempat.",
    authLoginButton: "Masuk",
    authLoginLocked: "Login terkunci",
    authLoginProcessing: "Memproses...",
    authLoginEmailLabel: "Email",
    authLoginPasswordLabel: "Password",
    authLoginEmailPlaceholder: "nama@email.com",
    authLoginPasswordPlaceholder: "Masukkan password",
    authForgotPasswordLink: "Lupa password?",
    authNoAccountText: "Belum punya akun?",
    authSignupNowLink: "Daftar sekarang",
    authDividerLogin: "atau masuk dengan",
    authGoogleConnecting: "Menghubungkan...",
    authTermsLoginLead: "Dengan masuk, kamu menyetujui",
    authTermsSignupLead: "Dengan mendaftar, kamu menyetujui",
    authTermsAnd: "dan",
    authTermsTail: ".",
    authTermsLink: "Syarat & Ketentuan",
    authPrivacyLink: "Kebijakan Privasi",
    authShowPassword: "Lihat password",
    authHidePassword: "Sembunyikan password",
    authLoginInvalid: "Periksa kembali email dan password yang diisi.",
    authLoginWrongCreds: "Email atau password belum cocok.",
    authLoginBootstrapFailed:
      "Akun berhasil diverifikasi, tetapi dashboard belum siap dibuka.",
    authLoginBlockedTitle: "Akun diblokir",
    authLoginBlockedMessage:
      "Akun ini sedang diblokir dan belum bisa digunakan.",
    authLoginLockedTitle: "Login terkunci",
    authLoginInvalidHint: "Periksa kembali email dan password yang diisi.",
    authLoginHeldTitle: "Login tertahan",
    authLoginOauthErrorTitle: "Login belum berhasil",
    authLoginOauthErrorText:
      "Terjadi kesalahan saat proses autentikasi.",
    authLoginGoogleFailedTitle: "Login Google gagal",
    authLoginGoogleFailedText:
      "Terjadi kendala saat menghubungkan akun Google. Silakan coba lagi.",

    // === AUTH — SIGNUP ===
    authSignupTitle: "Buat Akun Showreels",
    authSignupSubtitle:
      "Daftar gratis. Username unik untuk portofoliomu akan dibuatkan otomatis dan bisa diubah nanti.",
    authSignupButton: "Daftar",
    authSignupLocked: "Daftar terkunci",
    authSignupProcessing: "Membuat akun...",
    authSignupFullNameLabel: "Nama lengkap",
    authSignupEmailLabel: "Email",
    authSignupPasswordLabel: "Password",
    authSignupConfirmPasswordLabel: "Konfirmasi password",
    authSignupPasswordPlaceholder: "Minimal 8 karakter",
    authSignupConfirmPasswordPlaceholder: "Ulangi password",
    authHasAccountText: "Sudah punya akun?",
    authLoginHereLink: "Masuk di sini",
    authDividerSignup: "atau daftar dengan",
    authGoogleSignupFailedTitle: "Daftar dengan Google gagal",
    authGoogleSignupFailedText:
      "Terjadi kendala saat menghubungkan akun Google. Silakan coba lagi.",
    authSignupInvalid: "Periksa kembali data pendaftaran yang diisi.",
    authSignupRegisterFailed: "Gagal membuat akun.",
    authSignupAutoLoginTitle: "Akun berhasil dibuat",
    authSignupAutoLoginText:
      "Akun sudah dibuat. Silakan login dengan email dan password yang baru didaftarkan.",
    authSignupAutoLoginInline:
      "Akun sudah dibuat, tetapi login otomatis belum berhasil. Silakan masuk manual.",
    authSignupSetupIncomplete:
      "Akun sudah dibuat, tetapi setup awal belum selesai.",
    authSignupBlockedTitle: "Akun diblokir",
    authSignupBlockedMessage:
      "Akun ini sedang diblokir dan belum bisa digunakan.",
    authSignupLockedTitle: "Daftar terkunci",
    authSignupInvalidHint:
      "Periksa kembali data pendaftaran yang diisi.",
    authSignupDbNotConfigured:
      "Database belum terhubung. Coba lagi setelah konfigurasi selesai.",
    authSignupInvalidPayload: "Data pendaftaran belum valid.",
    authSignupUsernameReserved:
      "Username tidak dapat digunakan. Coba username lain.",
    authSignupUsernameTaken: "Username sudah dipakai. Pilih username lain.",
    authSignupEmailTaken:
      "Email sudah terdaftar. Silakan masuk ke akunmu.",
    authSignupGenericError:
      "Terjadi kesalahan saat membuat akun. Silakan coba lagi.",
    authSignupNotReadyTitle: "Profil belum siap",
    authSignupCatchError:
      "Pendaftaran belum bisa diproses. Coba lagi sebentar lagi.",

    // === AUTH — FORGOT PASSWORD ===
    authResetTitle: "Atur Ulang Password",
    authResetSubtitle:
      "Masukkan email terdaftar untuk menerima link reset",
    authResetSentSubtitle: "Cek email kamu untuk instruksi selanjutnya",
    authResetButton: "Kirim Link Reset",
    authResetSending: "Mengirim...",
    authResetResend: "Kirim ulang",
    authResetRememberText: "Ingat kembali?",
    authResetBackToLogin: "Kembali ke login",
    authResetEmptyEmail: "Silakan masukkan alamat email.",
    authResetSendFailed: "Gagal mengirim link reset. Coba lagi.",
    authResetNetworkError:
      "Terjadi kesalahan. Periksa koneksi internet dan coba lagi.",
    authResetEmailSentPrefix:
      "Link untuk mengatur ulang password telah dikirim ke",
    authResetCheckSpamLead:
      "Buka email kamu dan klik tautan di dalamnya.",
    authResetCheckSpamTail:
      "Jika tidak muncul, cek folder spam atau junk.",
    authResetEmailLabel: "Email",
    authResetEmailPlaceholder: "nama@email.com",
    authResetEmailRequiredTitle: "Email wajib diisi",
    authResetEmailRequiredHint: "Silakan masukkan alamat email.",
    authResetSendFailedTitle: "Gagal mengirim link reset",
    authResetNetworkErrorTitle: "Terjadi kesalahan",

    // === AUTH — RESET PASSWORD (new password form) ===
    authNewPasswordTitle: "Buat Password Baru",
    authNewPasswordSubtitle: "Masukkan password baru untuk akunmu.",
    authNewPasswordLabel: "Password baru",
    authNewPasswordConfirmLabel: "Konfirmasi password baru",
    authNewPasswordPlaceholder: "Minimal 8 karakter",
    authNewPasswordMinHint: "Password minimal 8 karakter.",
    authNewPasswordMismatchHint: "Konfirmasi password tidak sama.",
    authNewPasswordInvalidTokenTitle: "Link tidak valid",
    authNewPasswordInvalidTokenHint: "Link reset password tidak valid atau sudah kedaluwarsa. Minta link baru.",
    authNewPasswordSuccessTitle: "Password berhasil diubah",
    authNewPasswordSuccessHint: "Password kamu berhasil diperbarui. Silakan masuk dengan password baru.",
    authNewPasswordSubmitting: "Menyimpan...",
    authNewPasswordSubmit: "Simpan Password Baru",
    authNewPasswordRequestNew: "Minta link reset baru",
    authNewPasswordBackToLogin: "Kembali ke login",

    // === LANDING — HERO (Hero.tsx UI strings) ===
    landingHeroHeadlineLead: "Satu link untuk",
    landingHeroHeadlineAccent: "semua karya video terbaikmu.",
    landingHeroSubheadline:
      "Portofolio video profesional dari YouTube, TikTok, Instagram, dan Vimeo — dalam satu halaman siap dibagikan.",
    landingHeroUsernamePlaceholder: "username-kamu",
    landingHeroClear: "Hapus",
    landingHeroCheck: "Cek",
    landingHeroAvailableSuffix: "tersedia!",
    landingHeroTakenInline: "Username sudah dipakai, coba yang lain.",
    landingHeroRegisterCta: "Daftar Sekarang",

    // === LANDING — CTA BANNER ===
    landingCtaPointFast: "Setup < 2 menit",
    landingCtaPointFree: "Tanpa kartu kredit",
    landingCtaPointCustom: "Full customize",
    landingCtaTitle: "Siap tampil profesional dengan satu link?",
    landingCtaPrimaryButton: "Mulai Gratis",
    landingCtaSecondaryButton: "Login",

    // === LANDING — HOW IT WORKS ===
    landingHowItWorksStepsEyebrow: "CARA KERJA",
    landingHowItWorksStepsDescription:
      "Mulai gunakan Showreels dalam 3 langkah sederhana dan cepat.",
    landingHowItWorksStepPill1: "LANGKAH 1",
    landingHowItWorksStepPill2: "LANGKAH 2",
    landingHowItWorksStepPill3: "LANGKAH 3",
    landingHowItWorksStepTitle1: "Pilih Paket",
    landingHowItWorksStepTitle2: "Tambah Video",
    landingHowItWorksStepTitle3: "Publish & Bagikan",
    landingHowItWorksStepHeading1: "Mulai gratis, upgrade kapan saja",
    landingHowItWorksStepBody1:
      "Tidak perlu kartu kredit. Pilih paket Free atau langsung Creator untuk fitur penuh.",
    landingHowItWorksStepHeading2: "Username custom, semua platform",
    landingHowItWorksStepBody2:
      "Daftarkan username unikmu dan sambungkan YouTube, TikTok, Instagram, Vimeo dalam satu klik.",
    landingHowItWorksStepHeading3: "Satu link, semua platform",
    landingHowItWorksStepBody3:
      "Bagikan ke Instagram bio, TikTok, LinkedIn, atau WhatsApp. Pantau views dan klik real-time.",
    landingHowItWorksResult1Lead: "Akun aktif dalam",
    landingHowItWorksResult1Value: "< 1 menit",
    landingHowItWorksResult2Lead: "Link siap pakai di",
    landingHowItWorksResult2Value: "showreels.id/kamu",
    landingHowItWorksResult3Lead: "Rata-rata klik pertama dalam",
    landingHowItWorksResult3Value: "24 jam",
    landingHowItWorksNextStep: "Langkah berikutnya",
    landingHowItWorksReadyCta: "Siap? Mulai sekarang",

    // === LANDING — TRUST SECTION ===
    landingTrustEncrypted: "Pembayaran terenkripsi & aman",
    landingTrustCancelAnytime: "Batalkan kapan saja",

    // === LANDING — FEATURE SECTION ===
    landingFeatureSectionEyebrow: "FITUR UTAMA",
    landingFeatureSectionHeadline: "Tools sederhana untuk portofolio profesional.",

    // === LANDING — FAQ SECTION ===
    landingFaqSectionHeadline: "Pertanyaan yang sering ditanyakan.",

    // === LANDING — FEATURE CARD ===
    landingFeatureCardBuildLink: "Buat Link",

    // === LANDING — HEADER (extra UI strings) ===
    landingHeaderMenu: "Menu",
    landingHeaderLanguageLabel: "Bahasa",
    landingHeaderGetStarted: "Mulai Gratis",
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
    landingBadge: "Creator Video Portfolio Platform",
    landingTitle: "One public page for your creator profile and best video work.",
    landingDescription:
      "showreels.id helps creators organize a public profile, custom links, social/contact links, and public video pages in one share-ready destination.",
    landingCtaPrimary: "Start Building Your Portfolio",
    landingCtaSecondary: "Go to Dashboard",
    landingNavFeatures: "Features",
    landingNavThemes: "Themes",
    landingNavPricing: "Pricing",
    landingNavFaq: "FAQ",
    landingClaimCta: "Claim",
    landingHeroBadge: "Portfolio Platform",
    landingHeroTitleLead: "One link.",
    landingHeroTitleAccent: "Your videos.",
    landingHeroDescription:
      "Show your creator identity, key expertise, and best video work in one clean public page that looks professional and is easy to share.",
    landingHeroInputHint: "Check your username now",
    landingHeroInputPlaceholder: "your_name",
    landingHeroInputAction: "Claim",
    landingHeroStatusIdle: "Check username availability in real-time.",
    landingHeroStatusChecking: "Checking username...",
    landingHeroStatusAvailable: "Great username is still available.",
    landingHeroStatusTaken: "This username is already taken.",
    landingHeroStatusInvalid: "Use 3-24 characters: letters, numbers, underscore.",
    landingThemesBadge: "Themes",
    landingThemesTitleLead: "Theme direction for",
    landingThemesTitleAccent: "profile & video",
    landingThemesDescription:
      "Visual styles for your creator profile and video pages.",
    landingThemesCta: "Themes",
    landingThemesPresetStarter: "Creator Clean",
    landingThemesPresetCampaign: "Portfolio Warm",
    landingThemesPresetStudio: "Studio Focus",
    landingThemesPresetPersonal: "Editorial Soft",
    landingThemesPresetAgency: "Minimal Contrast",
    landingThemesFeatureCustomLinks: "Main links",
    landingThemesFeatureSocialLinks: "Contact",
    landingThemesFeatureVideoHighlight: "Latest video",
    landingThemesFeatureContact: "Clean profile",
    landingThemesFeatureVisibility: "Visibility context",
    landingThemesFeaturePortfolio: "Consistent portfolio listing",
    landingFeaturesBadge: "Core Features",
    landingFeaturesTitleLead: "Real capabilities",
    landingFeaturesTitleAccent: "for video creators.",
    landingFeaturesDescription:
      "Showreels focuses on public creator profiles, public video pages, custom links, and visibility controls managed from your dashboard.",
    landingPlatformBadge: "Platforms",
    landingPlatformTitleLead: "Video sources",
    landingPlatformTitleAccent: "supported by Showreels",
    landingPlatformDescription:
      "Connect your work from the most-used creator platforms and present everything in one public portfolio page.",
    landingPricingBadge: "Pricing",
    landingPricingTitleLead: "Simple plans for",
    landingPricingTitleAccent: "great creators.",
    landingPricingDescription:
      "Choose Free, Creator, or Business based on your growth stage, then continue through a simple checkout flow.",
    landingPricingMonthlyLabel: "Monthly",
    landingPricingYearlyLabel: "Yearly",
    landingPricingYearlySave: "Save 2 months",
    landingPricingFree: "Start with a personal public profile",
    landingPricingCreator: "More control and capacity for active creators",
    landingPricingTeam: "Suitable for studios and agencies",
    landingTestimonialsBadge: "Testimonials",
    landingTestimonialsTitleLead: "From creators,",
    landingTestimonialsTitleAccent: "to creators.",
    landingTestimonialsDescription:
      "Stories from creators using Showreels to present their best work.",
    landingFaqBadge: "FAQ",
    landingFaqTitleLead: "Any",
    landingFaqTitleAccent: "questions?",
    landingFaqDescription:
      "Quick answers about public profile pages, public video pages, custom links, and visibility modes.",
    landingFinalBadge: "Ready to start?",
    landingFinalTitleLead: "Ready to grow",
    landingFinalTitleAccent: "your digital portfolio",
    landingFinalTitleTail: "today?",
    landingFinalDescription:
      "Build your creator page now. Free to start, no credit card required, and focused on your best video work.",
    landingFinalPrimaryCta: "Start",
    landingFinalSecondaryCta: "Demo",
    landingFinalPointFast: "Setup in 2 minutes",
    landingFinalPointFree: "No credit card",
    landingFinalPointFlexible: "Update anytime",
    statCreators: "Active creators",
    statVideos: "Stored videos",
    statProfiles: "Share-ready public profiles",
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
    profileCustomLinksTitle: "Custom Links",
    profileCustomLinksDescription:
      "Add your priority links so visitors can take action faster.",
    profileCustomLinksAdd: "Add link",
    profileCustomLinksLimit: "Maximum {max} custom links per creator.",
    profileCustomLinksEmpty:
      "No custom links yet. Add key links like media kit, store, or booking.",
    profileCustomLinksLabel: "Link",
    profileCustomLinksNamePlaceholder: "Link title (e.g. Media Kit)",
    profileCustomLinksUrlPlaceholder: "https://your-link.com",
    profileCustomLinksMoveUp: "Move up",
    profileCustomLinksMoveDown: "Move down",
    profileCustomLinksRemove: "Remove link",
    profileCustomLinksToggle: "Show this link on public pages",
    publicPrimaryLinksTitle: "Primary Links",
    landingHowItWorksBadge: "How It Works",
    landingHowItWorksTitleLead: "Fast &",
    landingHowItWorksTitleAccent: "Easy",
    landingHowItWorksDescription: "Start using Showreels in 3 simple and quick steps.",
    landingHowItWorksStep1Label: "Step 1",
    landingHowItWorksStep1Title: "Pick a plan & subscribe",
    landingHowItWorksStep1Description: "Choose the right plan, then sign up with email or Google in minutes.",
    landingHowItWorksStep2Label: "Step 2",
    landingHowItWorksStep2Title: "Upload your videos",
    landingHowItWorksStep2Description: "Connect videos from YouTube, Drive, Instagram, Vimeo, or Facebook to your portfolio.",
    landingHowItWorksStep3Label: "Step 3",
    landingHowItWorksStep3Title: "Publish and share",
    landingHowItWorksStep3Description: "Set visibility, publish your work, and share your profile link.",
    landingBenefitStrip1: "Share-ready public profile",
    landingBenefitStrip2: "Videos from 5 platforms",
    landingBenefitStrip3: "Full visibility control",
    landingBenefitStrip4: "Custom links & contact",
    landingValuePropBadge: "Why Showreels",
    landingValuePropTitle: "One page.",
    landingValuePropAccent: "All your work.",
    landingValuePropBody: "Video creators need a clean place to present their identity, expertise, and best work — not scattered across multiple platforms.",
    landingProblemBadge: "The Problem",
    landingProblemTitle: "Your work is scattered everywhere",
    landingProblemItem1: "Video links spread across different platforms",
    landingProblemItem2: "No single professional profile page",
    landingProblemItem3: "Hard to control who sees what",
    landingProblemItem4: "Client review process is slow and inefficient",
    landingSolutionBadge: "The Solution",
    landingSolutionTitle: "One page that does it all",
    landingSolutionItem1: "Public profile with bio, skills, and contact",
    landingSolutionItem2: "Videos from YouTube, Drive, Instagram, Vimeo, Facebook",
    landingSolutionItem3: "Visibility control: draft, private, semi-private, public",
    landingSolutionItem4: "Priority custom links for media kit, booking, and more",
    landingCreatorsTitle: "Creators who have joined",
    landingCreatorsEmpty: "Be the first to join.",

    // === AUTH — LOGIN ===
    authLoginTitle: "Sign in to Showreels",
    authLoginSubtitle:
      "Access your dashboard and manage your video portfolio in one place.",
    authLoginButton: "Sign in",
    authLoginLocked: "Sign in locked",
    authLoginProcessing: "Processing...",
    authLoginEmailLabel: "Email",
    authLoginPasswordLabel: "Password",
    authLoginEmailPlaceholder: "name@email.com",
    authLoginPasswordPlaceholder: "Enter your password",
    authForgotPasswordLink: "Forgot password?",
    authNoAccountText: "Don't have an account yet?",
    authSignupNowLink: "Sign up now",
    authDividerLogin: "or sign in with",
    authGoogleConnecting: "Connecting...",
    authTermsLoginLead: "By signing in, you agree to our",
    authTermsSignupLead: "By signing up, you agree to our",
    authTermsAnd: "and",
    authTermsTail: ".",
    authTermsLink: "Terms & Conditions",
    authPrivacyLink: "Privacy Policy",
    authShowPassword: "Show password",
    authHidePassword: "Hide password",
    authLoginInvalid: "Please double-check your email and password.",
    authLoginWrongCreds: "Email or password is incorrect.",
    authLoginBootstrapFailed:
      "Your account is verified, but the dashboard is not ready yet.",
    authLoginBlockedTitle: "Account blocked",
    authLoginBlockedMessage:
      "This account is currently blocked and cannot be used.",
    authLoginLockedTitle: "Login locked",
    authLoginInvalidHint:
      "Please double-check the email and password you entered.",
    authLoginHeldTitle: "Sign in held",
    authLoginOauthErrorTitle: "Sign in failed",
    authLoginOauthErrorText:
      "Something went wrong during authentication.",
    authLoginGoogleFailedTitle: "Google sign in failed",
    authLoginGoogleFailedText:
      "We couldn't connect your Google account. Please try again.",

    // === AUTH — SIGNUP ===
    authSignupTitle: "Create a Showreels account",
    authSignupSubtitle:
      "Sign up for free. A unique username for your portfolio will be generated automatically and you can change it later.",
    authSignupButton: "Sign up",
    authSignupLocked: "Sign up locked",
    authSignupProcessing: "Creating account...",
    authSignupFullNameLabel: "Full name",
    authSignupEmailLabel: "Email",
    authSignupPasswordLabel: "Password",
    authSignupConfirmPasswordLabel: "Confirm password",
    authSignupPasswordPlaceholder: "At least 8 characters",
    authSignupConfirmPasswordPlaceholder: "Repeat password",
    authHasAccountText: "Already have an account?",
    authLoginHereLink: "Sign in here",
    authDividerSignup: "or sign up with",
    authGoogleSignupFailedTitle: "Google sign up failed",
    authGoogleSignupFailedText:
      "We couldn't connect your Google account. Please try again.",
    authSignupInvalid: "Please double-check your sign up details.",
    authSignupRegisterFailed: "Failed to create account.",
    authSignupAutoLoginTitle: "Account created",
    authSignupAutoLoginText:
      "Your account has been created. Please sign in with the email and password you just registered.",
    authSignupAutoLoginInline:
      "Your account was created, but auto sign in failed. Please sign in manually.",
    authSignupSetupIncomplete:
      "Your account was created, but the initial setup is not complete yet.",
    authSignupBlockedTitle: "Account blocked",
    authSignupBlockedMessage:
      "This account is currently blocked and cannot be used.",
    authSignupLockedTitle: "Sign up locked",
    authSignupInvalidHint:
      "Please double-check the sign-up details you entered.",
    authSignupDbNotConfigured:
      "The database is not connected yet. Please try again once setup is complete.",
    authSignupInvalidPayload: "The sign-up details are not valid.",
    authSignupUsernameReserved:
      "This username cannot be used. Please try another one.",
    authSignupUsernameTaken: "This username is already taken. Please choose another one.",
    authSignupEmailTaken:
      "This email is already registered. Please sign in to your account.",
    authSignupGenericError:
      "Something went wrong while creating your account. Please try again.",
    authSignupNotReadyTitle: "Profile not ready",
    authSignupCatchError:
      "We couldn't process your sign up. Please try again in a moment.",

    // === AUTH — FORGOT PASSWORD ===
    authResetTitle: "Reset your password",
    authResetSubtitle:
      "Enter your registered email to receive a reset link",
    authResetSentSubtitle: "Check your email for the next steps",
    authResetButton: "Send reset link",
    authResetSending: "Sending...",
    authResetResend: "Resend",
    authResetRememberText: "Remembered it?",
    authResetBackToLogin: "Back to sign in",
    authResetEmptyEmail: "Please enter your email address.",
    authResetSendFailed: "Failed to send the reset link. Please try again.",
    authResetNetworkError:
      "Something went wrong. Please check your internet connection and try again.",
    authResetEmailSentPrefix:
      "A link to reset your password has been sent to",
    authResetCheckSpamLead:
      "Open your email and click the link inside.",
    authResetCheckSpamTail:
      "If you don't see it, please check your spam or junk folder.",
    authResetEmailLabel: "Email",
    authResetEmailPlaceholder: "name@email.com",
    authResetEmailRequiredTitle: "Email is required",
    authResetEmailRequiredHint: "Please enter your email address.",
    authResetSendFailedTitle: "Failed to send the reset link",
    authResetNetworkErrorTitle: "Something went wrong",

    // === AUTH — RESET PASSWORD (new password form) ===
    authNewPasswordTitle: "Create New Password",
    authNewPasswordSubtitle: "Enter a new password for your account.",
    authNewPasswordLabel: "New password",
    authNewPasswordConfirmLabel: "Confirm new password",
    authNewPasswordPlaceholder: "At least 8 characters",
    authNewPasswordMinHint: "Password must be at least 8 characters.",
    authNewPasswordMismatchHint: "Passwords do not match.",
    authNewPasswordInvalidTokenTitle: "Invalid link",
    authNewPasswordInvalidTokenHint: "The password reset link is invalid or has expired. Please request a new one.",
    authNewPasswordSuccessTitle: "Password updated",
    authNewPasswordSuccessHint: "Your password has been updated. Please sign in with your new password.",
    authNewPasswordSubmitting: "Saving...",
    authNewPasswordSubmit: "Save new password",
    authNewPasswordRequestNew: "Request a new reset link",
    authNewPasswordBackToLogin: "Back to sign in",

    // === LANDING — HERO (Hero.tsx UI strings) ===
    landingHeroHeadlineLead: "One link for",
    landingHeroHeadlineAccent: "all your best video work.",
    landingHeroSubheadline:
      "A professional video portfolio from YouTube, TikTok, Instagram, and Vimeo — on a single page that's ready to share.",
    landingHeroUsernamePlaceholder: "your-username",
    landingHeroClear: "Clear",
    landingHeroCheck: "Check",
    landingHeroAvailableSuffix: "available!",
    landingHeroTakenInline: "This username is taken, please try another.",
    landingHeroRegisterCta: "Sign up now",

    // === LANDING — CTA BANNER ===
    landingCtaPointFast: "Setup in < 2 minutes",
    landingCtaPointFree: "No credit card",
    landingCtaPointCustom: "Full customize",
    landingCtaTitle: "Ready to look professional with a single link?",
    landingCtaPrimaryButton: "Start free",
    landingCtaSecondaryButton: "Sign in",

    // === LANDING — HOW IT WORKS ===
    landingHowItWorksStepsEyebrow: "HOW IT WORKS",
    landingHowItWorksStepsDescription:
      "Start using Showreels in 3 simple and quick steps.",
    landingHowItWorksStepPill1: "STEP 1",
    landingHowItWorksStepPill2: "STEP 2",
    landingHowItWorksStepPill3: "STEP 3",
    landingHowItWorksStepTitle1: "Pick a plan",
    landingHowItWorksStepTitle2: "Add your videos",
    landingHowItWorksStepTitle3: "Publish & share",
    landingHowItWorksStepHeading1: "Start free, upgrade anytime",
    landingHowItWorksStepBody1:
      "No credit card required. Choose the Free plan or jump straight to Creator for the full feature set.",
    landingHowItWorksStepHeading2: "Custom username, every platform",
    landingHowItWorksStepBody2:
      "Register your unique username and connect YouTube, TikTok, Instagram, Vimeo in a single click.",
    landingHowItWorksStepHeading3: "One link, every platform",
    landingHowItWorksStepBody3:
      "Share it on your Instagram bio, TikTok, LinkedIn, or WhatsApp. Track views and clicks in real time.",
    landingHowItWorksResult1Lead: "Account active in",
    landingHowItWorksResult1Value: "< 1 minute",
    landingHowItWorksResult2Lead: "Link ready at",
    landingHowItWorksResult2Value: "showreels.id/you",
    landingHowItWorksResult3Lead: "Average first click in",
    landingHowItWorksResult3Value: "24 hours",
    landingHowItWorksNextStep: "Next step",
    landingHowItWorksReadyCta: "Ready? Let's start",

    // === LANDING — TRUST SECTION ===
    landingTrustEncrypted: "Encrypted & secure payments",
    landingTrustCancelAnytime: "Cancel anytime",

    // === LANDING — FEATURE SECTION ===
    landingFeatureSectionEyebrow: "CORE FEATURES",
    landingFeatureSectionHeadline: "Simple tools for a professional portfolio.",

    // === LANDING — FAQ SECTION ===
    landingFaqSectionHeadline: "Frequently asked questions.",

    // === LANDING — FEATURE CARD ===
    landingFeatureCardBuildLink: "Build Link",

    // === LANDING — HEADER (extra UI strings) ===
    landingHeaderMenu: "Menu",
    landingHeaderLanguageLabel: "Language",
    landingHeaderGetStarted: "Start free",
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

const REGISTER_ERROR_CODE_TO_KEY: Record<string, keyof Dictionary> = {
  db_not_configured: "authSignupDbNotConfigured",
  invalid_payload: "authSignupInvalidPayload",
  username_reserved: "authSignupUsernameReserved",
  username_taken: "authSignupUsernameTaken",
  email_taken: "authSignupEmailTaken",
  register_failed: "authSignupGenericError",
};

export function getRegisterErrorMessage(
  dictionary: Dictionary,
  payload: { code?: string; error?: string } | null | undefined
): string {
  if (payload?.code && payload.code in REGISTER_ERROR_CODE_TO_KEY) {
    const key = REGISTER_ERROR_CODE_TO_KEY[payload.code];
    return dictionary[key] as string;
  }
  if (payload?.error && payload.error !== "INVALID_PAYLOAD") {
    return payload.error;
  }
  return dictionary.authSignupGenericError;
}
