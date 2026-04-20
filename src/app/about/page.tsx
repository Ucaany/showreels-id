import Link from "next/link";
import { Lightbulb, Rocket, Users } from "lucide-react";
import { PublicMobileHeader } from "@/components/public-mobile-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <PublicMobileHeader ctaHref="/auth/signup" ctaLabel="Buat Profilmu" />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Card className="border-border bg-surface">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            About VideoPort AI Hub
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-slate-950 sm:text-4xl">
            Platform portofolio kreator untuk tampil lebih meyakinkan di depan klien.
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
            VideoPort AI Hub dibuat untuk membantu content creator, editor, dan
            videographer mengelola karya dalam format yang lebih profesional.
            Fokus kami adalah membuat creator lebih mudah menyiapkan profil, submit
            video, dan membagikannya ke klien lewat halaman publik yang clean.
          </p>
        </Card>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-surface">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Rocket className="h-5 w-5" />
            </div>
            <h2 className="mt-3 font-display text-xl font-semibold text-slate-900">
              Misi
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Membantu creator menampilkan kualitas kerja secara profesional
              tanpa perlu setup website yang rumit.
            </p>
          </Card>
          <Card className="border-border bg-surface">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="mt-3 font-display text-xl font-semibold text-slate-900">
              Untuk Siapa
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Content creator, social media specialist, videographer, editor,
              dan tim kreatif agency.
            </p>
          </Card>
          <Card className="border-border bg-surface">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Lightbulb className="h-5 w-5" />
            </div>
            <h2 className="mt-3 font-display text-xl font-semibold text-slate-900">
              Nilai Utama
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Simpel, cepat, dan fokus pada hasil presentasi karya yang membuat
              klien lebih mudah mengambil keputusan.
            </p>
          </Card>
        </section>

        <Card className="border-border bg-surface">
          <h2 className="font-display text-2xl font-semibold text-slate-900">
            Siap tampilkan portfolio terbaikmu?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Mulai dari profil creator, lanjut submit video, dan bagikan link ke klien.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/auth/signup">
              <Button>Mulai Sekarang</Button>
            </Link>
            <Link href="/customer-service">
              <Button variant="secondary">Hubungi Customer Service</Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}

