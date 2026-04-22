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

export async function showFeedbackAlert({
  title,
  text,
  icon = "info",
  confirmButtonText = "Mengerti",
  timer,
}: FeedbackAlertOptions) {
  const Swal = (await import("sweetalert2")).default;

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
