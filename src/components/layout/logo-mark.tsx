import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-9 h-9 bg-navy rounded-xl flex items-center justify-center shadow-inner",
        className
      )}
    >
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 7H20M4 12H20M4 17H14"
          stroke="#0EA47A"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
        <path
          d="M19 15.5L21.5 18L19 20.5"
          stroke="#F97316"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
