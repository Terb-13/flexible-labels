"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/pricing/engine";
import type { ApprovalDecision, JobTicket, SavedEstimate } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function OutputStep({
  estimate,
  ticket,
  approvals,
  actorName,
  onApprove,
  onGenerateTicket,
  onSchedule,
}: {
  estimate: SavedEstimate | null;
  ticket: JobTicket | null;
  approvals: ApprovalDecision[];
  actorName: string;
  onApprove: (decision: "approved" | "rejected", reason: string) => void;
  onGenerateTicket: () => void;
  onSchedule?: (ticket: JobTicket) => void;
}) {
  const [reason, setReason] = useState("");

  if (!estimate) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-navy">Approval & output</h2>
        <p className="text-sm text-slate-600">
          Save the estimate on the previous step to continue. Below-target quotes
          stay here until someone logs who, when, and why.
        </p>
      </div>
    );
  }

  const relatedApprovals = approvals.filter((a) => a.estimateId === estimate.id);
  const canTicket = estimate.status === "approved";
  const alreadyTicketed = estimate.status === "ticketed" || Boolean(ticket);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-navy">Approval & output</h2>
        <p className="text-sm text-slate-600 mt-1">
          {estimate.id} · {estimate.companyName} ·{" "}
          {formatCurrency(estimate.breakdown.finalPrice)}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4 text-sm space-y-1">
        <div className="font-semibold">Status: {estimate.status.replaceAll("_", " ")}</div>
        <div className="text-slate-600">
          Actual margin {estimate.breakdown.marginPercent}% vs target{" "}
          {estimate.breakdown.targetMarginPercent}%
        </div>
        <div className="text-slate-600">
          Asset {estimate.breakdown.recommendedAssetName} ·{" "}
          {estimate.breakdown.materialSku}
        </div>
      </div>

      {estimate.status === "pending_approval" && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            This quote is below target. A Job Ticket cannot be generated until an
            approval is logged.
          </div>
          <Textarea
            rows={3}
            placeholder="Reason for approval or rejection (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="teal"
              disabled={!reason.trim()}
              onClick={() => onApprove("approved", reason)}
            >
              Approve as {actorName}
            </Button>
            <Button
              variant="outline"
              disabled={!reason.trim()}
              onClick={() => onApprove("rejected", reason)}
            >
              Reject
            </Button>
          </div>
        </div>
      )}

      {estimate.status === "rejected" && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          This estimate was rejected. Start a new estimate or adjust specs and save
          again.
        </div>
      )}

      {(canTicket || alreadyTicketed) && (
        <div className="space-y-3">
          {!alreadyTicketed ? (
            <Button className="w-full" onClick={onGenerateTicket}>
              Generate job ticket
            </Button>
          ) : ticket ? (
            <div className="rounded-2xl border border-slate-200 p-4 text-sm space-y-2">
              <div className="font-semibold">{ticket.ticketNumber} ready</div>
              <div className="text-slate-600">
                {ticket.widthIn}&quot; × {ticket.heightIn}&quot; ·{" "}
                {ticket.quantity.toLocaleString()} · {ticket.materialName}
              </div>
              <div className="text-slate-600">
                Lane: {ticket.recommendedResource}
              </div>
              <div className="text-xs text-slate-500">
                Refs: {ticket.internalRefs.estimateId}
                {ticket.internalRefs.approvalId
                  ? ` · ${ticket.internalRefs.approvalId}`
                  : ""}
              </div>
              {ticket.scheduled ? (
                <div className="text-emerald-700 font-semibold">On the Gantt scheduler</div>
              ) : onSchedule ? (
                <Button variant="outline" onClick={() => onSchedule(ticket)}>
                  Place on Gantt
                </Button>
              ) : (
                <p className="text-xs text-slate-500">
                  Open Operations to place this ticket on the scheduler.
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}

      {relatedApprovals.length > 0 && (
        <div>
          <div className="font-semibold text-sm mb-2">Approval log</div>
          <ul className="space-y-2 text-xs text-slate-600">
            {relatedApprovals.map((a) => (
              <li key={a.id} className="border-b pb-2">
                <span className="font-semibold">{a.decision.toUpperCase()}</span> · {a.decidedBy} ·{" "}
                {new Date(a.decidedAt).toLocaleString()} · {a.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
