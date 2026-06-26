"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Lightbulb, Rocket, Users, ArrowRight, Zap, Shield, Globe } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: i * 0.08 },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.48, ease: "easeOut" as const, delay: i * 0.08 },
  }),
};

const valueCards = [
  {
    title: "Misi Kami",
    description:
      "Membantu creator menampilkan kualitas kerja secara profesional tanpa perlu setup website yang rumit.",
    icon: Rocket,
    accent: "bg-brand-50 text-brand-500 ring-brand-100",
  },
  {
    title: "Untuk Siapa",
    description:
      "Content creator, social media specialist, videographer, editor, dan tim kreatif agency.",
    icon: Users,
    accent: "bg-violet-50 text-violet-500 ring-violet-100",
  },
  {
    title: "Nilai Utama",
    description:
      "Simpel, cepat, dan fokus pada presentasi karya yang memudahkan pengambilan keputusan.",
    icon: Lightbulb,
    accent: "bg-emerald-50 text-emerald-500 ring-emerald-100",
  },
];

const featureItems = [
  {
    icon: Zap,
    title: "Setup dalam 2 menit",
    description:
      "Buat profil, tambahkan video dari platform favorit, dan bagikan link-mu — semua tanpa koding.",
    accent: "bg-brand-50 text-brand-500 ring-brand-100",
  },
  {
    icon: Globe,
    title: "Multi-platform",
    description:
      "YouTube, TikTok, Instagram, Vimeo, Google Drive, dan banyak lagi dalam satu halaman.",
    accent: "bg-violet-50 text-violet-500 ring-violet-100",
  },
  {
    icon: Shield,
    title: "Profesional & terpercaya",
    description:
      "Tampilan yang clean dan meyakinkan membuat klien lebih mudah menilai kualitas kerjamu.",
    accent: "bg-emerald-50 text-emerald-500 ring-emerald-100",
  },
];

export default function AboutContent() {
  return (
    <main>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 grid-bg-soft" aria-hidden />
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-[0.15] blur-[100px]"
          style={{ background: "radial-gradient(circle, #4f87fb 0%, transparent 70%)" }}
          aria-hidden
        />

        <div className="container mx-auto max-w-[1180px] px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="show"
              custom={0}
              className="mb-4 flex items-center justify-center gap-3 text-ink/35"
            >
              <span className="h-px w-8 bg-current" />
              <span className="rounded-full border border-brand-100 bg-white px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                Tentang showreels.id
              </span>
              <span className="h-px w-8 bg-current" />
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="text-section-display font-semibold text-ink"
            >
              Platform portofolio untuk creator yang ingin tampil{" "}
              <span className="font-accent text-accent">profesional.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="mt-5 text-body-lg text-ink/55"
            >
              showreels.id dibuat untuk membantu content creator, editor, dan videographer
              mengelola karya dalam format yang lebih profesional — mudah disiapkan, mudah
              dibagikan.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              <Link
                href="/auth/login"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-[13.5px] font-semibold text-white shadow-button transition-all hover:-translate-y-px hover:bg-ink/90"
              >
                Mulai Gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/customer-service"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-6 text-[13.5px] font-semibold text-ink transition-all hover:-translate-y-px hover:border-ink/20 hover:bg-surface-soft"
              >
                Hubungi Kami
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Value Cards ── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-[1180px] px-5 sm:px-6">
          {/* eyebrow */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            className="mb-10 flex flex-col items-center text-center"
          >
            <div className="mb-4 flex items-center gap-3 text-ink/35">
              <span className="h-px w-8 bg-current" />
              <span className="rounded-full border border-brand-100 bg-white px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                Kenapa kami
              </span>
              <span className="h-px w-8 bg-current" />
            </div>
            <h2 className="text-section-display font-semibold text-ink">
              Dibangun dengan{" "}
              <span className="font-accent text-accent">tujuan jelas.</span>
            </h2>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {valueCards.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.3 }}
                  custom={i}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative rounded-2xl border border-border bg-white p-7 shadow-card hover:border-brand-200 hover:shadow-blue"
                >
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${item.accent}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-card-title font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-body-base text-ink/55 leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Story Section ── */}
      <section className="relative py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 grid-bg-soft" aria-hidden />

        <div className="container mx-auto max-w-[1180px] px-5 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            {/* left: text */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="mb-4 flex items-center gap-3 text-ink/35">
                <span className="h-px w-8 bg-current" />
                <span className="rounded-full border border-brand-100 bg-white px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Cerita Kami
                </span>
              </div>
              <h2 className="text-section-display font-semibold text-ink">
                Kenapa kami membangun{" "}
                <span className="font-accent text-accent">showreels.id?</span>
              </h2>
              <p className="mt-5 text-body-lg text-ink/55">
                Banyak creator berbakat kesulitan menampilkan portofolio video mereka secara
                profesional. Link YouTube yang bertebaran, folder Google Drive yang tidak
                tertata, atau website mahal yang butuh waktu lama untuk dibuat — semua itu
                menjadi hambatan.
              </p>
              <p className="mt-4 text-body-base text-ink/50">
                showreels.id hadir sebagai solusi: satu link, semua video, tampilan
                profesional. Kami fokus pada kesederhanaan dan kecepatan agar kamu bisa lebih
                fokus pada karya, bukan pada setup teknis.
              </p>
            </motion.div>

            {/* right: feature list */}
            <div className="flex flex-col gap-4">
              {featureItems.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <motion.div
                    key={feat.title}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.3 }}
                    custom={i}
                    className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5 shadow-soft"
                  >
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${feat.accent}`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-ink">{feat.title}</p>
                      <p className="mt-1 text-body-base text-ink/50">{feat.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-[1180px] px-5 sm:px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 px-8 py-16 text-center shadow-card md:px-14 md:py-20"
          >
            {/* glow */}
            <div
              className="pointer-events-none absolute left-1/2 top-0 h-72 w-[640px] -translate-x-1/2 opacity-25 blur-[90px]"
              style={{ background: "radial-gradient(ellipse, #4f87fb 0%, transparent 70%)" }}
              aria-hidden
            />

            <div className="relative">
              <div className="mb-4 flex items-center justify-center gap-3 text-white/25">
                <span className="h-px w-8 bg-current" />
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-300">
                  Mulai Sekarang
                </span>
                <span className="h-px w-8 bg-current" />
              </div>

              <h2 className="text-section-display font-semibold text-white">
                Siap tampil{" "}
                <span className="font-accent text-accent">profesional</span>{" "}
                dengan satu link?
              </h2>

              <p className="mx-auto mt-4 max-w-md text-body-base text-white/50">
                Mulai dari profil creator, tambahkan video, dan bagikan link publikmu —
                gratis, tanpa kartu kredit.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/auth/login"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-[13.5px] font-semibold text-ink shadow-button transition-all hover:-translate-y-px hover:bg-white/90"
                >
                  Buat Profilmu Gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/customer-service"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-6 text-[13.5px] font-semibold text-white/70 transition-all hover:-translate-y-px hover:border-white/35 hover:text-white"
                >
                  Hubungi Customer Service
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
