"use client";

import { DEMO_COMPANY, DEMO_CUSTOMERS } from "@/lib/data/demo-data";
import type { Company, SavedEstimate } from "@/types";
import { cn } from "@/lib/utils";

export function CustomerStep({
  internal,
  company,
  onCompanyId,
  previousEstimates,
  selectedEstimateId,
  onSelectPrevious,
  onStartBlank,
}: {
  internal: boolean;
  company: Company;
  onCompanyId: (id: string) => void;
  previousEstimates: SavedEstimate[];
  selectedEstimateId: string | null;
  onSelectPrevious: (estimate: SavedEstimate) => void;
  onStartBlank: () => void;
}) {
  if (!internal) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-navy">Who is this quote for?</h2>
          <p className="text-sm text-slate-600 mt-1">
            Business and reseller accounts receive different final prices.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <TierCard
            title="Business / DTC"
            body="Standard pricing for brands and direct buyers."
            active={company.id === DEMO_COMPANY.id}
            onClick={() => onCompanyId(DEMO_COMPANY.id)}
          />
          <TierCard
            title="Reseller / Wholesale"
            body="Wholesale pricing for print partners and distributors."
            active={company.is_reseller}
            onClick={() => onCompanyId(DEMO_CUSTOMERS[1].id)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-navy">Select the customer</h2>
        <p className="text-sm text-slate-600 mt-1">
          Margin % and target come from the customer record. The engine never
          hard-codes those rates.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {DEMO_CUSTOMERS.map((c) => {
          const active = c.id === company.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onCompanyId(c.id)}
              className={cn(
                "text-left rounded-2xl border p-4 transition-colors",
                active ? "border-teal bg-teal/5" : "border-slate-200 hover:border-teal/40"
              )}
            >
              <div className="font-semibold text-navy">{c.name}</div>
              <div className="text-xs text-slate-500 mt-1">
                {c.is_reseller ? "Reseller" : "Direct"}
              </div>
              <div className="mt-3 text-sm text-slate-700">
                Applied margin <span className="font-semibold">{c.margin_percent}%</span>
                <span className="text-slate-400"> · </span>
                Target <span className="font-semibold">{c.target_margin_percent}%</span>
              </div>
            </button>
          );
        })}
      </div>

      <div>
        <div className="font-semibold mb-2">Start from</div>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={onStartBlank}
            className={cn(
              "px-4 py-2 rounded-2xl text-sm font-semibold border",
              !selectedEstimateId
                ? "view-toggle-active border-navy"
                : "border-slate-200 text-slate-600"
            )}
          >
            Blank estimate
          </button>
        </div>
        {previousEstimates.length === 0 ? (
          <p className="text-sm text-slate-500">
            No saved estimates yet. Continue with a blank spec.
          </p>
        ) : (
          <ul className="space-y-2">
            {previousEstimates.slice(0, 6).map((estimate) => (
              <li key={estimate.id}>
                <button
                  type="button"
                  onClick={() => onSelectPrevious(estimate)}
                  className={cn(
                    "w-full text-left rounded-2xl border px-4 py-3 text-sm transition-colors",
                    selectedEstimateId === estimate.id
                      ? "border-teal bg-teal/5"
                      : "border-slate-200 hover:border-teal/40"
                  )}
                >
                  <div className="font-semibold">
                    {estimate.companyName} · {estimate.spec.productType}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {estimate.spec.widthIn}&quot; × {estimate.spec.heightIn}&quot; ·{" "}
                    {estimate.spec.quantity.toLocaleString()} · {estimate.status.replace("_", " ")}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TierCard({
  title,
  body,
  active,
  onClick,
}: {
  title: string;
  body: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-2xl border p-4 transition-colors",
        active ? "border-teal bg-teal/5" : "border-slate-200 hover:border-teal/40"
      )}
    >
      <div className="font-semibold text-navy">{title}</div>
      <p className="text-sm text-slate-600 mt-1">{body}</p>
    </button>
  );
}
