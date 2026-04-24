import Link from "next/link";
import { Mail, MessageCircleMore, PhoneCall } from "lucide-react";
import { PublicMobileHeader } from "@/components/public-mobile-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CustomerServicePage() {
  return (
    <div className="min-h-screen bg-canvas">
      <PublicMobileHeader ctaHref="/auth/signup" ctaLabel="Buat Profilmu" />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Card className="border-border bg-surface">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e24f3b]">
            Customer Service
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#201b18] sm:text-4xl">
            Tim support siap bantu saat kamu butuh.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5f524b] sm:text-base">
            Jika kamu mengalami kendala login, submit video, pengaturan profil, atau
            akses halaman publik, tim customer service siap bantu dengan respons cepat.
          </p>
        </Card>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-surface">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#fde8e2] text-[#e24f3b]">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="mt-3 font-display text-xl font-semibold text-[#201b18]">
              Email
            </h2>
            <p className="mt-2 text-sm text-[#5f524b]">support@showreels.id</p>
            <p className="mt-1 text-xs text-[#7a6d65]">Respons 1x24 jam kerja.</p>
          </Card>
          <Card className="border-border bg-surface">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#fde8e2] text-[#e24f3b]">
              <PhoneCall className="h-5 w-5" />
            </div>
            <h2 className="mt-3 font-display text-xl font-semibold text-[#201b18]">
              Telepon
            </h2>
            <p className="mt-2 text-sm text-[#5f524b]">+62 812-3456-7890</p>
            <p className="mt-1 text-xs text-[#7a6d65]">Senin - Jumat, 09:00 - 17:00 WIB.</p>
          </Card>
          <Card className="border-border bg-surface">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#fde8e2] text-[#e24f3b]">
              <MessageCircleMore className="h-5 w-5" />
            </div>
            <h2 className="mt-3 font-display text-xl font-semibold text-[#201b18]">
              WhatsApp
            </h2>
            <p className="mt-2 text-sm text-[#5f524b]">+62 812-3456-7890</p>
            <p className="mt-1 text-xs text-[#7a6d65]">Untuk bantuan cepat dan konsultasi awal.</p>
          </Card>
        </section>

        <Card className="border-border bg-surface">
          <h2 className="font-display text-2xl font-semibold text-[#201b18]">
            Butuh bantuan sekarang?
          </h2>
          <p className="mt-2 text-sm text-[#5f524b]">
            Kamu bisa kembali ke dashboard untuk cek status video atau kirim pertanyaan
            langsung ke tim support kami.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button variant="secondary">Buka Dashboard</Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost">Tentang showreels.id</Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}

