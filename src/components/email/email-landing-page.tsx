"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showFeedbackAlert } from "@/lib/feedback-alert";

export function EmailLandingPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name || !message) {
      void showFeedbackAlert({
        title: "Form belum lengkap",
        text: "Mohon isi semua field yang tersedia",
        icon: "warning",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "admin@showreels.id",
          subject: `Permintaan dari ${name}`,
          html: `
            <h2>Permintaan Baru dari Website</h2>
            <p><strong>Nama:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Pesan:</strong></p>
            <p>${message}</p>
          `,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengirim email");
      }

      await showFeedbackAlert({
        title: "Berhasil!",
        text: "Permintaan Anda telah dikirim. Tim kami akan segera menghubungi Anda.",
        icon: "success",
      });

      setEmail("");
      setName("");
      setMessage("");
    } catch (error) {
      void showFeedbackAlert({
        title: "Gagal mengirim",
        text: "Terjadi kesalahan. Silakan coba lagi.",
        icon: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/10"
          >
            {/* Header Section with Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#ea580c] to-[#4169e1] px-8 py-12 text-white">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="mb-6 flex justify-center gap-4"
                >
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse rounded-2xl bg-white/20 blur-xl" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                      <Mail className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse rounded-2xl bg-white/20 blur-xl animation-delay-300" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                      <Mail className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-3 text-center text-4xl font-bold"
                >
                  .hello there
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center text-lg text-blue-100"
                >
                  Kami — tim HR experts yang siap membantu
                  <br />
                  Anda menemukan talenta terbaik.
                </motion.p>
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-8 px-8 py-10">
              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-6"
              >
                <h2 className="text-center text-2xl font-bold text-slate-900">
                  Siap membantu dalam berbagai format:
                </h2>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-[#ea580c]" />
                    <p className="text-slate-700">
                      <strong>Berbasis Proyek:</strong> Kami menemukan karyawan untuk tim internal atau outsource.
                      Melakukan evaluasi portofolio, keterampilan, dan tingkat
                      kesesuaian dengan kebutuhan Anda.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-[#ea580c]" />
                    <p className="text-slate-700">
                      <strong>Berkelanjutan:</strong> Mendukung atau sepenuhnya mengelola
                      departemen HR perusahaan Anda. Menemukan karyawan terbaik dan
                      melakukan evaluasi menyeluruh.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-6"
              >
                <h2 className="text-center text-2xl font-bold text-slate-900">
                  Bekerja dengan kami mudah dan efektif,
                  <br />
                  karena:
                </h2>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-[#ea580c]" />
                    <p className="text-slate-700">
                      Kami bekerja secara remote. Tidak terikat lokasi dan
                      waktu, serta mengurangi biaya operasional secara signifikan.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-[#ea580c]" />
                    <p className="text-slate-700">
                      Kami memiliki pengalaman dalam membentuk dan mengelola
                      tim remote dengan 30+ anggota. Menemukan dan memverifikasi
                      kandidat yang sempurna untuk Anda adalah keahlian kami.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-[#ea580c]" />
                    <p className="text-slate-700">
                      Eksekusi adalah prioritas. Anda akan mendapatkan karyawan ideal
                      tepat pada tanggal yang telah disepakati.
                    </p>
                  </div>
                </div>

                <p className="text-center text-lg font-semibold text-slate-900">
                  Butuh yang terbaik? Kami siap membantu.
                </p>
              </motion.div>

              {/* Contact Form */}
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Nama Lengkap
                  </label>
                  <Input
                    type="text"
                    placeholder="Masukkan nama Anda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Pesan
                  </label>
                  <textarea
                    placeholder="Ceritakan kebutuhan Anda..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isSubmitting}
                    required
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-[#ea580c] focus:outline-none focus:ring-2 focus:ring-[#fed7aa]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#ea580c] text-white shadow-lg shadow-[#ea580c]/30 hover:bg-[#c2410c]"
                >
                  {isSubmitting ? (
                    "Mengirim..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Kirim Permintaan
                    </>
                  )}
                </Button>
              </motion.form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
