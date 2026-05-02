import Link from "next/link";
import { Lightbulb, Rocket, Users } from "lucide-react";
import { PublicMobileHeader } from "@/components/public-mobile-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const valueCards = [
  {
    title: "Misi",
    description:
      "Membantu creator menampilkan kualitas kerja secara profesional tanpa perlu setup website yang rumit.",
    icon: Rocket,
  },
  {
    title: "Untuk Siapa",
    description:
      "Content creator, social media specialist, videographer, editor, dan tim kreatif agency.",
    icon: Users,
  },
  {
    title: "Nilai Utama",
    description:
      "Simpel, cepat, dan fokus pada presentasi karya yang memudahkan pengambilan keputusan.",
    icon: Lightbulb,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <PublicMobileHeader ctaHref="/auth/signup" ctaLabel="Buat Profilmu" />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <Card className="relative overflow-hidden border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#dbe5ff] blur-3xl" />
          <div className="relative max-w-4xl">
            <p className="text-eyebrow font-semibold uppercase text-[#1a46c9]">
              About showreels.id
            </p>
            <h1 className="mt-3 font-display text-[clamp(2rem,5vw,4rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-slate-950">
              Platform portofolio kreator untuk tampil lebih profesional dan meyakinkan.
            </h1>
            <p className="mt-5 max-w-3xl text-body-lg text-slate-600">
              showreels.id dibuat untuk membantu content creator, editor, dan videographer
              mengelola karya dalam format yang lebih profesional. Fokus kami adalah
              membuat creator lebih mudah menyiapkan profil, submit video, dan membagikannya
              lewat halaman publik yang bersih dan profesional.
            </p>
          </div>
        </Card>

        <section className="grid gap-4 md:grid-cols-3">
          {valueCards.map((item) => {
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
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </Card>
            );
          })}
        </section>

        <Card className="border-slate-200 bg-zinc-950 p-6 text-white shadow-sm sm:p-8">
          <p className="text-eyebrow font-semibold uppercase text-[#8da8ff]">Mulai sekarang</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.03em] text-white sm:text-3xl">
            Siap tampilkan portfolio terbaikmu?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
            Mulai dari profil creator, submit video, dan bagikan link publik kamu.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/auth/signup">
              <Button className="bg-[#1a46c9] text-white hover:bg-[#153aa8]">
                Mulai Sekarang
              </Button>
            </Link>
            <Link href="/customer-service">
              <Button variant="secondary" className="border-white/20 bg-white text-slate-950 hover:bg-slate-100">
                Hubungi Customer Service
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
