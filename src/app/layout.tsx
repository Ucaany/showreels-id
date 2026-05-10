import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { SentryInit } from "@/components/sentry-init";
import { AppProviders } from "@/providers/app-providers";
import { ToastContainer } from "@/components/ui/toast-container";
import { getRequestLocale } from "@/server/request-locale";

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
  title: "showreels.id",
  description: "Portfolio video profesional untuk creator.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html
      lang="id"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <SentryInit />
        <AppProviders initialLocale={locale}>{children}</AppProviders>
        <ToastContainer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
