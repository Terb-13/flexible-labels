"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; message: string; success?: boolean };

const ToastContext = createContext<{
  toast: (message: string, success?: boolean) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, success = false) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, success }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[120] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-2xl shadow-lg text-sm font-medium text-white animate-in slide-in-from-bottom-2 ${
              t.success ? "bg-emerald-600" : "bg-navy"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function Toaster() {
  return null;
}
