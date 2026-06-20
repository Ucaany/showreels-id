import type { Metadata } from "next";
import { LandingLangProvider } from "@/lib/i18n/landing-context";
import Header from "@/components/landing-new/Header";
import Footer from "@/components/landing-new/Footer";
import CustomerServiceBody from "./CustomerServiceBody";

export const metadata: Metadata = {
  title: "Pusat Bantuan — showreels.id",
  description:
    "Hubungi tim support showreels.id. Email, telepon, dan WhatsApp siap membantu kendala login, submit video, profil publik, dan pembayaran.",
};

export default function CustomerServicePage() {
  return (
    <LandingLangProvider>
      <main className="relative min-h-screen bg-white text-ink pt-[64px]">
        <Header hideNav />
        <CustomerServiceBody />
        <Footer />
      </main>
    </LandingLangProvider>
  );
}
