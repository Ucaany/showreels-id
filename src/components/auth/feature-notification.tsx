"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, BarChart3, Link2, Sparkles } from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Video className="h-5 w-5" />,
    title: "Portfolio Video Profesional",
    description: "Tampilkan karya terbaik Anda dengan player video berkualitas tinggi",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Analytics Mendalam",
    description: "Pantau performa portfolio dengan statistik pengunjung real-time",
  },
  {
    icon: <Link2 className="h-5 w-5" />,
    title: "Custom Links",
    description: "Buat link khusus untuk setiap project dan klien",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Tampilan Profesional",
    description: "Desain modern yang membuat portfolio Anda menonjol",
  },
];

export function FeatureNotification() {
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-20 hidden max-w-sm lg:block">
      {/* Promotional Badge */}
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2f73ff] to-[#6b46ff] px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
        <span className="text-sm">🎉</span>
        <span>Gratis 1 Bulan untuk Pengguna Baru</span>
      </div>

      {/* Feature Card */}
      <div className="rounded-2xl border border-white/20 bg-white/95 p-5 shadow-2xl backdrop-blur-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFeature}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            {/* Icon */}
            <div className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-[#2f73ff]/10 to-[#6b46ff]/10 p-3 text-[#2f73ff]">
              {features[currentFeature].icon}
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-[#1d1815]">
                {features[currentFeature].title}
              </h3>
              <p className="text-sm leading-relaxed text-[#4d638a]">
                {features[currentFeature].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Indicators */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentFeature(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentFeature
                  ? "w-6 bg-[#2f73ff]"
                  : "w-1.5 bg-[#d4e1f5] hover:bg-[#b7d2ff]"
              }`}
              aria-label={`Go to feature ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
