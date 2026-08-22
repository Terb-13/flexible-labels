"use client";

import { STEP_SUBTITLES, STEP_TITLES } from "@/components/estimator/wizard-constants";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatQuantity, stationCount } from "@/lib/pricing/engine";
import { cn } from "@/lib/utils";
import type {
  QuoteBreakdown,
  QuoteBreakResult,
  QuoteSpec,
  SavedQuote,
} from "@/types";

function buckets(breakdown: QuoteBreakdown) {
  const items = [
    { label: "Material", value: breakdown.materialCost },
    { label: "Press", value: breakdown.pressCost },
    { label: "Seamer", value: breakdown.seamerCost },
    { label: "Finishing", value: breakdown.finishingCost },
    { label: "Shipping", value: breakdown.shippingCost },
    { label: "Setup", value: breakdown.setupCost },
  ].filter((b) => b.value > 0);
  return items.length
    ? items
    : [
        { label: "Material", value: breakdown.materialCost },
        { label: "Press", value: breakdown.pressCost },
      ];
}

export function EstimateStep({
  spec,
  loading,
  breaks,
  viable,
  onSelectQty,
  mode,
  busy,
  saved,
  onSave,
  onApprove,
  onJob,
  onCheckout,
}: {
  spec: QuoteSpec;
  loading: boolean;
  breaks: QuoteBreakResult[];
  viable: boolean;
  onSelectQty: (qty: number) => void;
  mode: "public" | "employee";
  busy?: string | null;
  saved?: SavedQuote | null;
  onSave: () => void;
  onApprove?: () => void;
  onJob?: () => void;
  onCheckout?: () => void;
}) {
  const grouped = Boolean(spec.grouped);
  const primary = breaks[0]?.breakdown ?? null;
  const viewing =
    breaks.find((b) => b.quantity === spec.quantity)?.breakdown ?? primary;
  const viewQty = spec.quantity || breaks[0]?.quantity || 1;

  if (loading && !viewing) {
    return (
      <div className="py-16 text-center font-mono text-sm text-slate-400">
        Calculating…
      </div>
    );
  }

  if (!viable || !viewing) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
        <div className="text-3xl mb-3">⚠️</div>
        <h2 className="heading-font text-2xl font-semibold">No viable route</h2>
        <p className="mt-2 mx-auto max-w-md font-mono text-xs text-slate-500">
          Nothing in the EXAMPLE catalog qualifies for this product, material,
          width, and color count. Check size against press max width, or pick
          another material. The estimator did not invent a layout.
        </p>
      </div>
    );
  }

  const bd = buckets(viewing);
  const maxBd = Math.max(...bd.map((b) => b.value), 1);
  const stations = stationCount(spec);
  const route = viewing.lines
    .map((l) => l.equipmentName)
    .filter(Boolean)
    .join(" → ");

  return (
    <div>
      <h2 className="heading-font text-3xl md:text-4xl font-semibold tracking-tight">
        {STEP_TITLES[6]}
      </h2>
      <p className="mt-2 font-mono text-xs text-slate-500 max-w-xl">
        {STEP_SUBTITLES[6]}
      </p>

      <div className="mt-6 grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          <div className="rounded-3xl bg-navy px-6 py-6 text-white">
            <div className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
              Estimated total
            </div>
            <div className="heading-font mt-1 text-4xl md:text-5xl">
              {formatCurrency(viewing.finalPrice, true)}
            </div>
            <div className="mt-2 font-mono text-sm text-teal">
              {formatCurrency(viewing.finalPrice / viewQty, true)} / unit ·{" "}
              {formatQuantity(viewQty)} units
            </div>
            <div className="mt-3 font-mono text-[11px] text-slate-400">
              {viewing.productionFeet.toLocaleString("en-US", {
                maximumFractionDigits: 1,
              })}{" "}
              production feet · {viewing.plannedPressHours.toFixed(2)} planned
              press hours
              {spec.rush ? " · rush requested" : ""}
            </div>
            <div className="mt-3 rounded-2xl bg-white/5 px-3 py-2 font-mono text-[11px] text-slate-300">
              Route {viewing.routeName}
              {viewing.catalogSource === "example"
                ? " · EXAMPLE rates — not published plant costs"
                : " · plant catalog"}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="font-semibold">Cost buckets</div>
            <div className="mt-3 space-y-2">
              {bd.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <div className="w-20 font-mono text-[11px] text-slate-500">
                    {b.label}
                  </div>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-teal/70"
                      style={{ width: `${(b.value / maxBd) * 100}%` }}
                    />
                  </div>
                  <div className="w-16 text-right font-mono text-[11px] font-semibold">
                    {formatCurrency(b.value, true)}
                  </div>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2 text-sm font-semibold">
                <span>Total cost</span>
                <span>{formatCurrency(viewing.totalCost, true)}</span>
              </div>
              <div className="flex justify-between text-sm text-teal">
                <span>
                  Margin ({viewing.marginPercent}%)
                  {viewing.discountPercent > 0
                    ? ` after ${viewing.discountPercent}% company discount`
                    : ""}
                </span>
                <span>{formatCurrency(viewing.marginAmount, true)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="font-semibold">Production route</div>
            <p className="mt-1 font-mono text-[11px] text-slate-500">
              Auto-selected printer → seamer/finisher → ship
            </p>
            <div className="mt-3 space-y-2 text-sm">
              {viewing.lines.map((line) => (
                <div key={line.stage} className="flex justify-between text-slate-600">
                  <span>
                    {line.equipmentName}
                    {!line.qualified ? " (unqualified)" : ""}
                  </span>
                  <span className="font-mono text-xs">
                    {line.hours.toFixed(2)} h · {formatCurrency(line.cost, true)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[11px] text-slate-400">{route}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="font-semibold uppercase tracking-wide text-navy text-sm">
              Quantity breaks
            </div>
            {grouped ? (
              <div className="mt-3 rounded-2xl border border-teal bg-teal/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">
                      {formatQuantity(breaks[0]?.quantity ?? 0)} units
                      <span className="ml-2 rounded bg-teal px-1.5 py-0.5 font-mono text-[10px] text-white">
                        {spec.qtyBreaks?.filter((n) => n > 0).length ?? 1} breaks
                        grouped
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-teal">
                      {formatCurrency(
                        (primary?.finalPrice ?? 0) /
                          Math.max(breaks[0]?.quantity ?? 1, 1),
                        true
                      )}{" "}
                      each
                    </div>
                  </div>
                  <div className="font-mono font-bold">
                    {formatCurrency(primary?.finalPrice ?? 0, true)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <p className="font-mono text-[11px] text-slate-400">
                  Each break priced independently — click to view
                </p>
                {breaks.map((b) => {
                  const on = b.quantity === spec.quantity;
                  return (
                    <button
                      key={b.quantity}
                      type="button"
                      onClick={() => onSelectQty(b.quantity)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left",
                        on ? "border-teal bg-teal/5" : "border-slate-200 bg-white"
                      )}
                    >
                      <div>
                        <div className="font-semibold">
                          {formatQuantity(b.quantity)} units
                          {on && (
                            <span className="ml-2 rounded bg-navy px-1.5 py-0.5 font-mono text-[10px] text-white">
                              Viewing
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-xs text-teal">
                          {formatCurrency(
                            b.breakdown.finalPrice / Math.max(b.quantity, 1),
                            true
                          )}{" "}
                          each
                        </div>
                      </div>
                      <div className="font-mono font-bold">
                        {formatCurrency(b.breakdown.finalPrice, true)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 h-fit lg:sticky lg:top-24">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-slate-400">
              Job configuration
            </div>
            {(
              [
                ["Product", spec.product],
                ["Material", spec.material],
                ["Size", `${spec.widthIn}" × ${spec.heightIn}"`],
                ["Stations", String(stations)],
                ["Across / repeat", `${spec.across} / ${spec.repeatIn}"`],
                ["Route", viewing.routeName],
                ["Timeline", spec.rush ? "Rush" : "Standard"],
                spec.shape ? ["Shape", spec.shape] : null,
                spec.unwind ? ["Unwind", `Wind ${spec.unwind}`] : null,
                spec.coreSize ? ["Core", spec.coreSize] : null,
                spec.features?.length ? ["Features", spec.features.join(", ")] : null,
              ] as ([string, string] | null)[]
            )
              .filter(Boolean)
              .map((row) => (
                <div
                  key={row![0]}
                  className="flex justify-between gap-3 border-b border-slate-200/80 py-1.5"
                >
                  <span className="font-mono text-[10px] text-slate-400">{row![0]}</span>
                  <span className="text-right text-xs font-semibold">{row![1]}</span>
                </div>
              ))}
          </div>
          {viewing.needsApproval && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Below target margin ({viewing.targetMarginPercent}%). Approval
              required before a job ticket.
            </div>
          )}
          <Button
            className="w-full"
            variant="cta"
            disabled={Boolean(busy) || !viewing}
            onClick={onSave}
          >
            {busy === "save" ? "Saving…" : saved ? "Quote saved" : "Save quote"}
          </Button>
          {mode === "public" && onCheckout && (
            <Button
              className="w-full"
              variant="outline"
              disabled={!viewing}
              onClick={onCheckout}
            >
              Place order — pay now
            </Button>
          )}
          {mode === "employee" && saved?.needs_approval && saved.status !== "approved" && (
            <Button
              className="w-full"
              variant="outline"
              disabled={busy === "approve"}
              onClick={onApprove}
            >
              Submit for review / approve
            </Button>
          )}
          {mode === "employee" && onJob && (
            <Button
              className="w-full"
              disabled={!saved || saved.status !== "approved" || busy === "job"}
              onClick={onJob}
            >
              {busy === "job" ? "Writing job…" : "Generate job ticket"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
