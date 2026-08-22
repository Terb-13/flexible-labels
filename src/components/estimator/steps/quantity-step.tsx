"use client";

import { QTY_PRESETS, STEP_SUBTITLES, STEP_TITLES } from "@/components/estimator/wizard-constants";
import { Input } from "@/components/ui/input";
import { formatQuantity } from "@/lib/pricing/engine";
import { cn } from "@/lib/utils";
import type { QuoteSpec } from "@/types";

function commit(
  breaks: number[],
  grouped: boolean
): Pick<QuoteSpec, "qtyBreaks" | "grouped" | "quantity"> {
  const clean = breaks.slice(0, 7);
  const valid = clean.filter((n) => n > 0);
  return {
    qtyBreaks: clean,
    grouped,
    quantity: grouped ? valid.reduce((s, n) => s + n, 0) : valid[0] || 0,
  };
}

export function QuantityStep({
  spec,
  onChange,
  mode = "employee",
}: {
  spec: QuoteSpec;
  onChange: (patch: Partial<QuoteSpec>) => void;
  mode?: "public" | "employee";
}) {
  const breaks =
    spec.qtyBreaks && spec.qtyBreaks.length
      ? spec.qtyBreaks
      : spec.quantity
        ? [spec.quantity]
        : [0];
  const grouped = Boolean(spec.grouped);
  const valid = breaks.filter((n) => n > 0);
  const sum = valid.reduce((s, n) => s + n, 0);

  function setBreaks(next: number[], g = grouped) {
    onChange(commit(next, g));
  }

  return (
    <div>
      <h2 className="heading-font text-3xl md:text-4xl font-semibold tracking-tight">
        {STEP_TITLES[5]}
      </h2>
      <p className="mt-2 font-mono text-xs text-slate-500 max-w-xl">
        {mode === "public"
          ? "Enter the quantity you want priced."
          : STEP_SUBTITLES[5]}
      </p>
      {mode === "public" ? (
        <div className="mt-8 max-w-lg space-y-4">
          <Input
            type="number"
            min={0}
            step={100}
            className="max-w-[220px] font-mono text-base font-bold"
            value={spec.quantity || ""}
            placeholder="quantity"
            onChange={(e) => {
              const quantity = Number(e.target.value) || 0;
              onChange({ quantity, qtyBreaks: [quantity], grouped: false });
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              Quick add
            </span>
            {QTY_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs font-semibold text-slate-600 hover:border-teal"
                onClick={() =>
                  onChange({ quantity: p, qtyBreaks: [p], grouped: false })
                }
              >
                {formatQuantity(p)}
              </button>
            ))}
          </div>
        </div>
      ) : (
      <>
      <div className="mt-8 max-w-lg space-y-2">
        {breaks.map((qty, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-16 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              Break {i + 1}
            </span>
            <Input
              type="number"
              min={0}
              step={100}
              className="max-w-[220px] font-mono text-base font-bold"
              value={qty || ""}
              placeholder="quantity"
              onChange={(e) => {
                const next = [...breaks];
                next[i] = Number(e.target.value) || 0;
                setBreaks(next);
              }}
            />
            {breaks.length > 1 && (
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-navy"
                onClick={() => setBreaks(breaks.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {breaks.length < 7 && (
          <button
            type="button"
            className="mt-2 rounded-2xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-teal"
            onClick={() => setBreaks([...breaks, 0])}
          >
            + Add quantity break
          </button>
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
          Quick add
        </span>
        {QTY_PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs font-semibold text-slate-600 hover:border-teal"
            onClick={() => {
              const next = [...breaks];
              const empty = next.findIndex((n) => !n);
              if (empty >= 0) next[empty] = p;
              else if (next.length < 7) next.push(p);
              setBreaks(next);
            }}
          >
            + {formatQuantity(p)}
          </button>
        ))}
      </div>
      <div
        className={cn(
          "mt-8 max-w-lg rounded-3xl border p-4",
          grouped ? "border-teal bg-teal/5" : "border-slate-200 bg-white"
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className={cn("font-semibold", grouped && "text-teal")}>
              Group these together
            </div>
            <p className="mt-1 max-w-sm font-mono text-[11px] text-slate-500">
              {grouped
                ? "Pricing as one family run — quantities are summed for volume."
                : "Each break is priced independently so the customer can choose."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={grouped}
            onClick={() => setBreaks(breaks, !grouped)}
            className={cn(
              "relative h-8 w-[52px] shrink-0 rounded-full",
              grouped ? "bg-teal" : "bg-slate-300"
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-6 w-6 rounded-full bg-white transition-[left]",
                grouped ? "left-6" : "left-1"
              )}
            />
          </button>
        </div>
        {grouped && sum > 0 && (
          <div className="mt-3 border-t border-teal/20 pt-3 font-mono text-xs font-semibold text-teal">
            Family total: {formatQuantity(sum)} units across {valid.length} break
            {valid.length === 1 ? "" : "s"}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
