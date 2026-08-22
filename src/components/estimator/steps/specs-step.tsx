"use client";

import {
  CORE_SIZES,
  CORNER_RADII,
  FEATURES,
  FINISHING,
  PREMIUM_FINISHES,
  SHAPES,
  STEP_SUBTITLES,
  STEP_TITLES,
  UNWIND_DIRS,
} from "@/components/estimator/wizard-constants";
import { Pill } from "@/components/estimator/pill";
import { TYPE_OPTIONS } from "@/lib/data/example-catalog";
import { cn } from "@/lib/utils";
import type { QuoteSpec } from "@/types";

function Head({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mt-8 mb-3">
      <div className="text-sm font-semibold tracking-wide text-navy uppercase">
        {title}
      </div>
      {sub && <div className="mt-1 font-mono text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

function toggle(list: string[] | undefined, id: string): string[] {
  const cur = list ?? [];
  return cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
}

export function SpecsStep({
  spec,
  onChange,
  mode = "public",
}: {
  spec: QuoteSpec;
  onChange: (patch: Partial<QuoteSpec>) => void;
  mode?: "public" | "employee";
}) {
  const eight = spec.shape === "rectangle" || spec.shape === "oval";
  const winds = eight ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4];

  return (
    <div>
      <h2 className="heading-font text-3xl md:text-4xl font-semibold tracking-tight">
        {STEP_TITLES[4]}
      </h2>
      <p className="mt-2 font-mono text-xs text-slate-500 max-w-xl">
        {mode === "employee"
          ? STEP_SUBTITLES[4]
          : "Finishes and options for this job."}
      </p>

      <Head
        title="Product type"
        sub={
          mode === "employee"
            ? "Catalog type used by route match — not customer DTC/reseller."
            : "How this label is used."
        }
      />
      <div className="flex flex-wrap gap-2">
        {TYPE_OPTIONS.map((type) => (
          <Pill key={type} on={spec.type === type} onClick={() => onChange({ type })}>
            <span className={cn("text-sm font-semibold", spec.type === type && "text-teal")}>
              {type}
            </span>
          </Pill>
        ))}
      </div>

      <Head
        title="Premium finishes"
        sub={
          mode === "employee"
            ? "Captured on the quote. Priced only when a catalog rate exists."
            : "Select any premium finishes you need."
        }
      />
      <div className="grid sm:grid-cols-2 gap-2 max-w-2xl">
        {PREMIUM_FINISHES.map((finish) => {
          const on = (spec.premiumFinishes ?? []).includes(finish);
          return (
            <Pill key={finish} on={on} onClick={() => onChange({ premiumFinishes: toggle(spec.premiumFinishes, finish) })}>
              <span className={cn("text-sm", on && "font-semibold text-teal")}>
                {on ? "✓ " : "+ "}
                {finish}
              </span>
            </Pill>
          );
        })}
      </div>

      <Head title="Production timeline" />
      <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
        <Pill
          on={!spec.rush}
          onClick={() => onChange({ rush: false })}
          className="flex-1"
        >
          <div className={cn("font-semibold", !spec.rush && "text-teal")}>Standard</div>
          <div className="font-mono text-[11px] text-slate-400">5–7 business days</div>
        </Pill>
        <Pill
          on={Boolean(spec.rush)}
          onClick={() => onChange({ rush: true })}
          className="flex-1"
        >
          <div className={cn("font-semibold", spec.rush && "text-teal")}>Rush</div>
          <div className="font-mono text-[11px] text-slate-400">
            {mode === "employee"
              ? "Captured — no invented rush adder"
              : "We’ll confirm timing after review"}
          </div>
        </Pill>
      </div>

      <Head title="Label shape" sub="Drives available unwind directions" />
      <div className="flex flex-wrap gap-2">
        {SHAPES.map(([id, label]) => (
          <Pill key={id} on={spec.shape === id} onClick={() => onChange({ shape: id })}>
            <span className={cn("text-sm font-semibold", spec.shape === id && "text-teal")}>
              {label}
            </span>
          </Pill>
        ))}
      </div>

      {spec.shape && (
        <>
          <Head
            title="Unwind direction"
            sub={
              eight
                ? "Rectangle & oval use winds 1–8. Winds 5–8 are face-in."
                : "Circle & square use winds 1–4 only."
            }
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl">
            {winds.map((w) => {
              const base = w > 4 ? w - 4 : w;
              const on = spec.unwind === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => onChange({ unwind: w })}
                  className={cn(
                    "rounded-2xl border px-3 py-3 text-center",
                    on ? "border-teal bg-teal/5" : "border-slate-200 bg-white"
                  )}
                >
                  <div className={cn("font-mono text-xs font-semibold", on && "text-teal")}>
                    Wind {w}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">
                    {UNWIND_DIRS[base]}
                  </div>
                  {w > 4 && (
                    <div className="mt-1 font-mono text-[10px] text-teal">face-in</div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      <Head title="Corner radius" />
      <div className="flex flex-wrap gap-2">
        {CORNER_RADII.map((r) => (
          <Pill key={r} on={spec.cornerRadius === r} onClick={() => onChange({ cornerRadius: r })}>
            <span className="font-mono text-xs font-semibold">{r}</span>
          </Pill>
        ))}
      </div>

      <Head title="Special features" />
      <div className="grid sm:grid-cols-3 gap-2 max-w-2xl">
        {FEATURES.map((f) => {
          const on = (spec.features ?? []).includes(f);
          return (
            <Pill
              key={f}
              on={on}
              onClick={() =>
                onChange({
                  features: toggle(spec.features, f),
                  variableData: f === "Variable data" ? !on : spec.variableData,
                })
              }
            >
              <span className={cn("text-sm", on && "font-semibold text-teal")}>
                {on ? "✓ " : "+ "}
                {f}
              </span>
            </Pill>
          );
        })}
      </div>

      <Head title="Core size" />
      <div className="flex flex-wrap gap-2">
        {CORE_SIZES.map((cs) => (
          <Pill key={cs} on={spec.coreSize === cs} onClick={() => onChange({ coreSize: cs })}>
            <span className="font-mono text-xs font-semibold">{cs} core</span>
          </Pill>
        ))}
      </div>

      <Head title="Finishing requirements" />
      <div className="grid sm:grid-cols-3 gap-2 max-w-2xl">
        {FINISHING.map((f) => {
          const on = (spec.finishing ?? []).includes(f);
          return (
            <Pill key={f} on={on} onClick={() => onChange({ finishing: toggle(spec.finishing, f) })}>
              <span className={cn("text-sm", on && "font-semibold text-teal")}>
                {on ? "✓ " : "+ "}
                {f}
              </span>
            </Pill>
          );
        })}
      </div>
    </div>
  );
}
