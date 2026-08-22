"use client";

import { Check } from "lucide-react";
import {
  canOpenStep,
  stepLabel,
  wizardSteps,
} from "@/components/estimator/wizard-constants";
import { cn } from "@/lib/utils";
import type { QuoteSpec } from "@/types";

export function WizardNav({
  current,
  spec,
  onGo,
  mode = "employee",
}: {
  current: number;
  spec: QuoteSpec;
  onGo: (step: number) => void;
  mode?: "public" | "employee";
}) {
  return (
    <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50">
      {wizardSteps(mode).map((i) => {
        const label = stepLabel(i, mode);
        const active = i === current;
        const done = i < current;
        const open = canOpenStep(i, current, spec);
        return (
          <button
            key={label}
            type="button"
            disabled={!open}
            onClick={() => open && onGo(i)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 px-2 py-3 text-[10.5px] font-medium uppercase tracking-widest whitespace-nowrap font-mono",
              active && "bg-white text-navy border-b-[3px] border-teal",
              done && !active && "text-teal",
              !active && !done && "text-slate-400 border-b-[3px] border-transparent",
              !open && "opacity-40 cursor-default"
            )}
          >
            <span
              className={cn(
                "inline-flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold text-white",
                done ? "bg-teal" : active ? "bg-navy" : "bg-slate-300"
              )}
            >
              {done ? <Check className="h-3 w-3" /> : wizardSteps(mode).indexOf(i) + 1}
            </span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
