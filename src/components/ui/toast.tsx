import { CheckCircle2, AlertTriangle, Info, OctagonAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";

const toastStyles = {
  success: {
    card: "border-emerald-100 bg-emerald-50/80",
    icon: "bg-emerald-100 text-emerald-700",
    iconNode: CheckCircle2,
  },
  warning: {
    card: "border-amber-100 bg-amber-50/80",
    icon: "bg-amber-100 text-amber-700",
    iconNode: AlertTriangle,
  },
  info: {
    card: "border-blue-100 bg-blue-50/80",
    icon: "bg-blue-100 text-blue-700",
    iconNode: Info,
  },
  error: {
    card: "border-rose-100 bg-rose-50/80",
    icon: "bg-rose-100 text-rose-700",
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
      "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-3.5 shadow-lg shadow-slate-900/5 ring-1 ring-white/60 backdrop-blur",
      style.card
    )}>
      <div className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
        style.icon
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-5 text-slate-600">{description}</p>
        )}
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="rounded-lg p-1 text-slate-500 hover:bg-white/60 hover:text-slate-800"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
