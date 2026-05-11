import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { SentryInit } from "@/components/sentry-init";
import { AppProviders } from "@/providers/app-providers";
import { ToastContainer } from "@/components/ui/toast-container";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://showreels.id"),
  title: {
    default: "showreels.id — Modern Video Portfolio for Creators",
    template: "%s | showreels.id",
  },
  description:
    "Bangun portfolio video profesional dalam satu link publik. Tampilkan profil creator, social links, custom links, dan karya terbaik dengan desain modern minimal.",
  keywords: [
    "showreels",
    "video portfolio",
    "portfolio creator",
    "creator profile",
    "showreel Indonesia",
    "public video page",
  ],
  applicationName: "showreels.id",
  creator: "showreels.id",
  publisher: "showreels.id",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://showreels.id",
    siteName: "showreels.id",
    title: "showreels.id — Modern Video Portfolio for Creators",
    description:
      "Satu halaman publik untuk profil creator, social links, custom links, dan karya video terbaik.",
  },
  twitter: {
    card: "summary_large_image",
    title: "showreels.id — Modern Video Portfolio for Creators",
    description:
      "Bangun portfolio video profesional dalam satu link publik yang cepat, rapi, dan siap dibagikan.",
  },
  appleWebApp: {
    title: "showreels",
    capable: true,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
    other: [{ rel: "manifest", url: "/site.webmanifest" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <SentryInit />
        <AppProviders initialLocale="id">{children}</AppProviders>
        <ToastContainer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
