"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Link2, PlaySquare, Sparkles } from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <PlaySquare className="h-3.5 w-3.5" />,
    eyebrow: "Video",
    title: "Showcase rapi",
    description: "Tampilkan karya terbaik dalam profil publik.",
  },
  {
    icon: <Link2 className="h-3.5 w-3.5" />,
    eyebrow: "Profile",
    title: "Satu link",
    description: "Gabungkan portfolio dan channel kreatif.",
  },
  {
    icon: <BarChart3 className="h-3.5 w-3.5" />,
    eyebrow: "Insight",
    title: "Data jelas",
    description: "Pantau sinyal penting dengan ringkas.",
  },
  {
    icon: <Sparkles className="h-3.5 w-3.5" />,
    eyebrow: "Identity",
    title: "Modern clean",
    description: "Tampilan monokrom dengan aksen biru.",
  },
];

export function FeatureNotification() {
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5200);

    return () => window.clearInterval(interval);
  }, []);

  const feature = features[currentFeature];

  return (
    <div className="absolute bottom-5 left-5 z-20 hidden w-[min(18rem,calc(100%-2.5rem))] lg:block xl:bottom-6 xl:left-6">
      <div className="overflow-hidden rounded-[1.15rem] border border-white/14 bg-white/[0.08] p-3 text-white shadow-xl shadow-black/20 ring-1 ring-white/10 backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(26,70,201,0.24),transparent_32%)]" />
        <div className="relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentFeature}
              initial={{ opacity: 0, x: 22, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -22, filter: "blur(6px)" }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="grid min-h-[5.65rem] grid-cols-[auto_1fr] gap-2.5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dbe5ff]/25 bg-[#1a46c9]/16 text-[#dbe5ff] shadow-sm shadow-[#1a46c9]/15">
                {feature.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#dbe5ff]">
                  {feature.eyebrow}
                </p>
                <h3 className="mt-1 font-display text-[1rem] font-extrabold leading-tight tracking-[-0.035em] text-white">
                  {feature.title}
                </h3>
                <p className="mt-1 text-[0.72rem] leading-5 text-white/62">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-white/10 pt-2.5">
            <div className="flex items-center gap-1.5">
              {features.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setCurrentFeature(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentFeature
                      ? "w-5 bg-[#1a46c9] shadow-[0_0_12px_rgba(26,70,201,0.55)]"
                      : "w-1.5 bg-white/28 hover:bg-white/55"
                  }`}
                  aria-label={`Tampilkan fitur ${index + 1}`}
                />
              ))}
            </div>
            <div className="text-[0.68rem] font-semibold text-white/48">
              {String(currentFeature + 1).padStart(2, "0")} / {String(features.length).padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
