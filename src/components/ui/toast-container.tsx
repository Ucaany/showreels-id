"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Toast } from "./toast";
import { useToastStore } from "@/hooks/use-toast";

export function ToastContainer() {
 const { toasts, removeToast } = useToastStore();

 return (
  <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
    <AnimatePresence initial={false}>
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          layout
          initial={{ opacity: 0, x: 40, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <Toast
            type={toast.type}
            title={toast.title}
            description={toast.description}
            onClose={() => removeToast(toast.id)}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
 );
}