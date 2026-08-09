import { cn } from "@/lib/utils";
import type { EstimateStatus } from "@/lib/estimating/estimate-types";

const STEPS: { key: EstimateStatus; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "for_estimate", label: "In queue" },
  { key: "estimating", label: "Estimating" },
  { key: "sent", label: "Sent" },
];

const ORDER: Record<EstimateStatus, number> = {
  draft: 0,
  for_estimate: 1,
  estimating: 2,
  sent: 3,
};

export function StatusStepper({ status }: { status: EstimateStatus }) {
  const current = ORDER[status] ?? 0;
  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((step, i) => (
        <li
          key={step.key}
          className={cn(
            "text-xs px-2.5 py-1 rounded-full border",
            i < current && "bg-emerald-50 border-emerald-200 text-emerald-700",
            i === current && "bg-teal/10 border-teal text-teal font-semibold",
            i > current && "bg-white border-slate-200 text-slate-400"
          )}
        >
          {step.label}
        </li>
      ))}
    </ol>
  );
}
