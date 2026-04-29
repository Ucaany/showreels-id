import Link from "next/link";
import { Mail, MessageCircleMore, PhoneCall } from "lucide-react";
import { PublicMobileHeader } from "@/components/public-mobile-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const supportChannels = [
  {
    title: "Email",
    value: "support@showreels.id",
    helper: "Respons 1x24 jam kerja.",
    icon: Mail,
  },
  {
    title: "Telepon",
    value: "+62 812-3456-7890",
    helper: "Senin - Jumat, 09:00 - 17:00 WIB.",
    icon: PhoneCall,
  },
  {
    title: "WhatsApp",
    value: "+62 812-3456-7890",
    helper: "Untuk bantuan cepat dan konsultasi awal.",
    icon: MessageCircleMore,
  },
];

export default function CustomerServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <PublicMobileHeader ctaHref="/auth/signup" ctaLabel="Buat Profilmu" />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <Card className="relative overflow-hidden border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#dbe5ff] blur-3xl" />
          <div className="relative max-w-4xl">
            <p className="text-eyebrow font-semibold uppercase text-[#1a46c9]">
              Customer Service
            </p>
            <h1 className="mt-3 font-display text-[clamp(2rem,5vw,4rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-slate-950">
              Tim support siap bantu saat kamu butuh.
            </h1>
            <p className="mt-5 max-w-3xl text-body-lg text-slate-600">
              Jika kamu mengalami kendala login, submit video, pengaturan profil, atau akses
              halaman publik, tim customer service siap bantu dengan respons cepat.
            </p>
          </div>
        </Card>

        <section className="grid gap-4 md:grid-cols-3">
          {supportChannels.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.title}
                className="border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#1a46c9]/10 sm:p-6"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#1a46c9] ring-1 ring-[#dbe5ff]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-display text-xl font-extrabold tracking-[-0.02em] text-slate-950">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-800">{item.value}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.helper}</p>
              </Card>
            );
          })}
        </section>

        <Card className="border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-eyebrow font-semibold uppercase text-[#1a46c9]">Bantuan cepat</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.03em] text-slate-950 sm:text-3xl">
            Butuh bantuan sekarang?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Kamu bisa kembali ke dashboard untuk cek status video atau kirim pertanyaan
            langsung ke tim support kami.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button variant="secondary">Buka Dashboard</Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost" className="text-[#1a46c9] hover:bg-[#eef4ff] hover:text-[#153aa8]">
                Tentang showreels.id
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
