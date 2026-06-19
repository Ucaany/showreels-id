"use client";

import { useState } from "react";
import { Check, X, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function UsernameChecker() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "available" | "taken">("idle");

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setStatus(username.toLowerCase() === "admin" ? "taken" : "available");
  };

  return (
    <section id="username" className="relative pt-8 pb-20 md:pt-10 md:pb-24 overflow-hidden">
      {/* Subtle top divider */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-[560px] max-w-full"
        style={{ background: "linear-gradient(to right, transparent, #e2e8f0 40%, #e2e8f0 60%, transparent)" }}
        aria-hidden
      />

      <div className="container mx-auto max-w-[580px] px-5 sm:px-6">
        {/* Heading */}
        <div className="mb-8 text-center">
          <h2 className="text-[1.55rem] sm:text-[1.9rem] font-semibold text-ink leading-tight tracking-tight">
            Username-mu masih tersedia?
          </h2>
          <p className="mt-2 text-[13.5px] text-ink/45">
            Klaim sekarang, gratis.
          </p>
        </div>

        {/* Input row */}
        <form onSubmit={check}>
          <div
            className={`flex items-center gap-0 rounded-2xl border bg-white transition-all ${
              status === "available"
                ? "border-brand-300 shadow-[0_0_0_3px_rgba(59,130,246,0.10)]"
                : status === "taken"
                ? "border-red-300 shadow-[0_0_0_3px_rgba(239,68,68,0.08)]"
                : "border-[#e2e8f0] shadow-[0_2px_16px_rgba(10,13,20,0.06)] focus-within:border-brand-300 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.10)]"
            }`}
          >
            {/* Prefix */}
            <span className="shrink-0 pl-4 pr-1 text-[13px] font-medium text-ink/40 select-none">
              showreels.id/
            </span>

            {/* Input */}
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""));
                setStatus("idle");
              }}
              placeholder="username-kamu"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 min-w-0 bg-transparent py-3.5 text-[13.5px] font-semibold text-ink outline-none placeholder:text-ink/25 placeholder:font-normal"
            />

            {/* Clear */}
            {username.length > 0 && (
              <button
                type="button"
                onClick={() => { setUsername(""); setStatus("idle"); }}
                className="shrink-0 mr-2 rounded-full p-1 text-ink/25 hover:text-ink/50 transition-colors"
                aria-label="Hapus"
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!username.trim()}
              className="m-1.5 shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-ink px-5 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-35 disabled:cursor-not-allowed"
            >
              Cek
              <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
            </button>
          </div>
        </form>

        {/* Status */}
        <div className="mt-5 flex flex-col items-center gap-3 min-h-[48px]">
          {status === "idle" && (
            <p className="text-[12px] text-ink/35">
              Huruf, angka, - atau _
            </p>
          )}

          {status === "available" && (
            <div className="flex flex-col items-center gap-3 animate-reveal">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-100 px-4 py-1.5">
                <Check className="h-3.5 w-3.5 text-brand-600" strokeWidth={2.6} />
                <span className="text-[12.5px] font-semibold text-brand-700">
                  showreels.id/{username} tersedia!
                </span>
              </div>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-5 py-2 text-[12.5px] font-semibold text-white shadow-[0_4px_16px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-0.5 hover:bg-brand-700"
              >
                Daftar Sekarang <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
              </Link>
            </div>
          )}

          {status === "taken" && (
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-100 px-4 py-1.5 animate-reveal">
              <X className="h-3.5 w-3.5 text-red-500" strokeWidth={2.5} />
              <span className="text-[12.5px] font-semibold text-red-600">
                Username sudah dipakai, coba yang lain.
              </span>
            </div>
          )}
        </div>

        {/* Social proof */}
        <p className="mt-6 text-center text-[11.5px] text-ink/30">
          Bergabung dengan{" "}
          <span className="font-semibold text-ink/50">12.000+ kreator</span>{" "}
          yang sudah punya link mereka.
        </p>
      </div>
    </section>
  );
}
