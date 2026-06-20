import { CheckCircle2, AlertTriangle, Info, OctagonAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";

const toastStyles = {
 success: {
   card: "border-emerald-100 bg-white text-emerald-600",
   icon: "bg-emerald-50 text-emerald-500",
   iconNode: CheckCircle2,
 },
 warning: {
   card: "border-amber-100 bg-white text-amber-600",
   icon: "bg-amber-50 text-amber-500",
   iconNode: AlertTriangle,
 },
 info: {
   card: "border-slate-200 bg-white text-slate-600",
   icon: "bg-slate-100 text-slate-500",
   iconNode: Info,
 },
 error: {
   card: "border-rose-100 bg-white text-rose-600",
   icon: "bg-rose-50 text-rose-500",
   iconNode: OctagonAlert,
 },
} as const;

export type ToastType = keyof typeof toastStyles;

export interface ToastProps {
 type?: ToastType;
 title: string;
 description?: string;
 onClose?: () => void;
}

export function Toast({
 type = "success",
 title,
 description,
 onClose
}: ToastProps) {
 const style = toastStyles[type];
 const Icon = style.iconNode;

 return (
  <div className={cn(
    "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-lg shadow-slate-900/5 max-sm:p-3.5",
    style.card
  )}>
    <div className={cn(
      "grid h-9 w-9 shrink-0 place-items-center rounded-full",
      style.icon
    )}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0 flex-1 pt-0.5">
      <p className="truncate text-sm font-medium text-slate-950">{title}</p>
      {description && (
        <p className="mt-0.5 truncate text-xs leading-5 text-slate-500">{description}</p>
      )}
    </div>
    {onClose && (
      <button
        onClick={onClose}
        className="rounded-lg p-1 text-slate-300 hover:bg-slate-50 hover:text-slate-700"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
 );
}