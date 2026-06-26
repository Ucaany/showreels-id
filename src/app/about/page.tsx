import { LandingLangProvider } from "@/lib/i18n/landing-context";
import Header from "@/components/landing-new/Header";
import Footer from "@/components/landing-new/Footer";
import AboutContent from "./AboutContent";

export const metadata = {
  title: "Tentang Kami — showreels.id",
  description:
    "showreels.id dibuat untuk membantu content creator, editor, dan videographer tampil lebih profesional lewat satu link portofolio yang bersih.",
};

export default function AboutPage() {
  return (
    <LandingLangProvider>
      <div className="relative min-h-screen bg-white text-ink pt-[64px]">
        <Header hideNav={false} />
        <AboutContent />
        <Footer />
      </div>
    </LandingLangProvider>
  );
}
