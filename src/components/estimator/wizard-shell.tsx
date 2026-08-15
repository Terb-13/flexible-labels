"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WizardStepDef } from "@/components/estimator/wizard-types";

export function WizardShell({
  steps,
  currentIndex,
  onStepSelect,
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  hideNext = false,
  children,
}: {
  steps: readonly WizardStepDef[];
  currentIndex: number;
  onStepSelect: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  hideNext?: boolean;
  children: ReactNode;
}) {
  const current = steps[currentIndex];
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="border border-slate-200 rounded-3xl bg-white overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-xs font-semibold tracking-wider text-slate-500">
            STEP {currentIndex + 1} OF {steps.length}
          </div>
          <div className="text-xs text-slate-500 sm:hidden">{current?.shortLabel}</div>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-teal rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="hidden sm:grid gap-2 mt-4" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
          {steps.map((step, index) => {
            const done = index < currentIndex;
            const active = index === currentIndex;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  disabled={index > currentIndex}
                  onClick={() => onStepSelect(index)}
                  className={cn(
                    "w-full text-left rounded-2xl px-3 py-2 border transition-colors",
                    active && "border-teal bg-teal/5",
                    done && "border-slate-200 bg-slate-50 hover:border-teal/40",
                    !active && !done && "border-transparent text-slate-400"
                  )}
                >
                  <div className="text-[10px] font-semibold tracking-wider text-slate-500">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div
                    className={cn(
                      "text-sm font-semibold leading-tight",
                      active ? "text-navy" : done ? "text-slate-700" : "text-slate-400"
                    )}
                  >
                    {step.label}
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="px-5 sm:px-6 py-6">{children}</div>

      <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={currentIndex === 0}
          onClick={onBack}
        >
          Back
        </Button>
        {!hideNext && (
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={nextDisabled}
            onClick={onNext}
          >
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
