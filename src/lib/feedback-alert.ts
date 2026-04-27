import type { SweetAlertIcon } from "sweetalert2";

type FeedbackAlertOptions = {
  title: string;
  text?: string;
  icon?: SweetAlertIcon;
  confirmButtonText?: string;
  timer?: number;
};

type ConfirmationOptions = {
  title: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: SweetAlertIcon;
};

function shouldUseCompactAlert() {
  if (typeof window === "undefined") {
    return false;
  }
  const pathname = window.location.pathname || "";
  return pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
}

export async function showFeedbackAlert({
  title,
  text,
  icon = "info",
  confirmButtonText = "Mengerti",
  timer,
}: FeedbackAlertOptions) {
  const Swal = (await import("sweetalert2")).default;
  const compact = shouldUseCompactAlert();
  const autoDismiss = icon === "success" || icon === "info";

  if (compact) {
    return Swal.fire({
      title,
      text,
      icon,
      toast: true,
      position:
        typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches
          ? "top"
          : "top-end",
      showConfirmButton: !autoDismiss,
      confirmButtonText,
      showCloseButton: !autoDismiss,
      timer: timer ?? (autoDismiss ? 2200 : undefined),
      timerProgressBar: autoDismiss,
      buttonsStyling: false,
      customClass: {
        popup:
          "rounded-xl border border-[#c8daf7] bg-white text-slate-900 shadow-[0_16px_36px_rgba(19,53,101,0.2)]",
        title: "text-sm font-semibold text-[#1d3764]",
        htmlContainer: "text-xs leading-5 text-[#5a739d]",
        confirmButton:
          "inline-flex h-8 items-center justify-center rounded-lg bg-[#2f73ff] px-3 text-xs font-semibold text-white transition hover:bg-[#245fe0]",
      },
    });
  }

  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonText,
    timer,
    timerProgressBar: Boolean(timer),
    buttonsStyling: false,
    customClass: {
      popup: "rounded-2xl border border-slate-200 bg-white text-slate-950",
      title: "font-display text-xl font-semibold text-slate-950",
      htmlContainer: "text-sm leading-relaxed text-slate-600",
      confirmButton:
        "inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2",
    },
  });
}

export async function confirmFeedbackAction({
  title,
  text,
  confirmButtonText = "Ya, lanjutkan",
  cancelButtonText = "Batal",
  icon = "warning",
}: ConfirmationOptions) {
  const Swal = (await import("sweetalert2")).default;

  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    buttonsStyling: false,
    customClass: {
      popup: "rounded-2xl border border-slate-200 bg-white text-slate-950",
      title: "font-display text-xl font-semibold text-slate-950",
      htmlContainer: "text-sm leading-relaxed text-slate-600",
      confirmButton:
        "inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2",
      cancelButton:
        "mr-2 inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2",
    },
  });

  return result.isConfirmed;
}
