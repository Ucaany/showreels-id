"use client";

import { Toast } from './toast';
import { useToastStore } from '@/hooks/use-toast';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-6 top-6 z-50 flex w-full max-w-sm flex-col gap-3 max-sm:inset-x-3 max-sm:right-auto max-sm:top-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          description={toast.description}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
