"use client";

import { formatCurrency, formatQuantity } from "@/lib/pricing/engine";
import type { Company, SavedQuote } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Needs review",
  approved: "Approved",
  sent: "Sent",
};

export function EstimateQueue({
  quotes,
  companies,
}: {
  quotes: SavedQuote[];
  companies: Company[];
}) {
  const nameFor = (id: string) => companies.find((c) => c.id === id)?.name ?? "Customer";

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-xl">Estimate queue</h2>
        <p className="text-sm text-slate-500">
          Recent quotes — customer, product, quantity, status.
        </p>
      </div>
      {!quotes.length ? (
        <div className="px-5 py-10 text-sm text-slate-500">
          No saved estimates yet. Start a new estimate to populate this list.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Quote</th>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium">Qty</th>
                <th className="px-3 py-2 font-medium">Total</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => {
                const breaks = q.qty_breaks?.length
                  ? q.qty_breaks
                  : q.spec.qtyBreaks ?? [q.spec.quantity];
                const qtyLabel = q.grouped
                  ? `${formatQuantity(breaks.reduce((s, n) => s + n, 0))} grouped`
                  : breaks.length > 1
                    ? breaks.map((n) => formatQuantity(n)).join(" / ")
                    : formatQuantity(q.spec.quantity);
                return (
                  <tr key={q.id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-mono text-xs font-semibold">
                      {q.quote_number}
                    </td>
                    <td className="px-3 py-3">{nameFor(q.company_id)}</td>
                    <td className="px-3 py-3">{q.spec.product}</td>
                    <td className="px-3 py-3 font-mono text-xs">{qtyLabel}</td>
                    <td className="px-3 py-3 font-mono text-xs">
                      {formatCurrency(q.breakdown.finalPrice, true)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="status-pill bg-slate-100 text-slate-700">
                        {STATUS_LABEL[q.status] ?? q.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
