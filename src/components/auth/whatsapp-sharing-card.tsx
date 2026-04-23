import Link from "next/link";
import { ExternalLink, MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";

const WHATSAPP_SHARING_URL =
  "https://chat.whatsapp.com/JQfV8aJl36E8DCtZFazHEC?mode=gi_t";

export function WhatsappSharingCard({
  variant = "dashboard",
}: {
  variant?: "compact" | "dashboard";
}) {
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        isCompact
          ? "rounded-2xl border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(255,255,255,0.98))] p-3 shadow-sm"
          : "dashboard-clean-card rounded-2xl border border-emerald-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_34%),linear-gradient(135deg,_rgba(236,253,245,0.98),_rgba(255,255,255,0.98))] p-4 shadow-sm sm:p-5"
      )}
    >
      <div
        className={cn(
          isCompact
            ? "flex items-start gap-2.5"
            : "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5"
        )}
      >
        <div className={cn("flex items-start", isCompact ? "gap-2.5" : "gap-3.5")}>
          <span
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700",
              isCompact ? "h-9 w-9" : "h-11 w-11 sm:h-12 sm:w-12"
            )}
          >
            <MessageCircle className={cn(isCompact ? "h-4 w-4" : "h-5 w-5")} />
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                "font-semibold text-slate-900",
                isCompact ? "text-sm" : "text-base sm:text-lg"
              )}
            >
              WhatsApp sharing
            </p>
            <p
              className={cn(
                "text-slate-600",
                isCompact
                  ? "mt-0.5 text-xs leading-relaxed"
                  : "mt-1 text-sm leading-6 sm:max-w-2xl"
              )}
            >
              Gabung komunitas sharing creator untuk diskusi portfolio, peluang
              project, dan kolaborasi.
            </p>
          </div>
        </div>

        <Link
          href={WHATSAPP_SHARING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50",
            isCompact
              ? "mt-2 h-10 w-full"
              : "h-11 w-full shrink-0 sm:mt-0 sm:w-auto sm:min-w-[220px]"
          )}
        >
          Buka WhatsApp sharing
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
