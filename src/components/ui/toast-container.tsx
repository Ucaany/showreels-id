"use client";

import { Toast } from './toast';
import { useToastStore } from '@/hooks/use-toast';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:top-6 max-sm:bottom-20 max-sm:left-4 max-sm:right-4 max-sm:top-auto max-sm:max-w-none">
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
