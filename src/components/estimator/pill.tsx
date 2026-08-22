"use client";

import { cn } from "@/lib/utils";

export function Pill({
  on,
  children,
  onClick,
  className,
}: {
  on?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-4 py-3 text-left transition-colors",
        on
          ? "border-teal bg-teal/5"
          : "border-slate-200 bg-white hover:border-teal/50",
        className
      )}
    >
      {children}
    </button>
  );
}
