"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/pricing/engine";
import type { ApprovalDecision, SavedEstimate } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ApprovalQueue({
  estimates,
  approvals,
  actorName,
  onDecide,
}: {
  estimates: SavedEstimate[];
  approvals: ApprovalDecision[];
  actorName: string;
  onDecide: (estimateId: string, decision: "approved" | "rejected", reason: string) => void;
}) {
  const pending = estimates.filter((e) => e.status === "pending_approval");
  const [reasons, setReasons] = useState<Record<string, string>>({});

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-xl">Margin approval queue</h2>
        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
          {pending.length} waiting
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-4">
        Quotes below the customer&apos;s target margin cannot become a Job Ticket until
        someone logs who, when, and why.
      </p>

      {pending.length === 0 ? (
        <div className="text-sm text-slate-500">No estimates waiting on approval.</div>
      ) : (
        <ul className="space-y-4">
          {pending.map((estimate) => (
            <li key={estimate.id} className="border rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-slate-500">{estimate.id}</div>
                  <div className="font-semibold">
                    {estimate.companyName} · {estimate.spec.productType}
                  </div>
                  <div className="text-sm text-slate-600">
                    {estimate.spec.widthIn}&quot; × {estimate.spec.heightIn}&quot; ·{" "}
                    {estimate.spec.quantity.toLocaleString()} · {estimate.breakdown.materialName}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">{formatCurrency(estimate.breakdown.finalPrice)}</div>
                  <div className="text-red-700">
                    {estimate.breakdown.marginPercent}% vs {estimate.breakdown.targetMarginPercent}% target
                  </div>
                </div>
              </div>
              <Textarea
                rows={2}
                placeholder="Reason for approval or rejection (required)"
                value={reasons[estimate.id] ?? ""}
                onChange={(e) =>
                  setReasons((prev) => ({ ...prev, [estimate.id]: e.target.value }))
                }
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="teal"
                  disabled={!reasons[estimate.id]?.trim()}
                  onClick={() =>
                    onDecide(estimate.id, "approved", reasons[estimate.id] ?? "")
                  }
                >
                  Approve as {actorName}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!reasons[estimate.id]?.trim()}
                  onClick={() =>
                    onDecide(estimate.id, "rejected", reasons[estimate.id] ?? "")
                  }
                >
                  Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {approvals.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-sm mb-2">Approval log</h3>
          <ul className="space-y-2 text-xs text-slate-600">
            {approvals.slice(0, 8).map((a) => (
              <li key={a.id} className="border-b pb-2">
                <span className="font-semibold">{a.decision.toUpperCase()}</span> · {a.decidedBy} ·{" "}
                {new Date(a.decidedAt).toLocaleString()} · {a.actualMarginPercent}% vs{" "}
                {a.targetMarginPercent}% · {a.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
