"use client";

import type { JobTicket } from "@/types";
import { Button } from "@/components/ui/button";

export function JobTicketPanel({
  tickets,
  onSchedule,
}: {
  tickets: JobTicket[];
  onSchedule: (ticket: JobTicket) => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6">
      <h2 className="font-semibold text-xl mb-1">Job Tickets</h2>
      <p className="text-sm text-slate-600 mb-4">
        Generated from approved estimates — ready to drop onto the Gantt scheduler
        without re-keying specs.
      </p>
      {tickets.length === 0 ? (
        <div className="text-sm text-slate-500">
          No tickets yet. Approve (if needed) and generate from the estimator.
        </div>
      ) : (
        <ul className="space-y-3">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="border rounded-2xl p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-slate-500">{ticket.ticketNumber}</div>
                  <div className="font-semibold">
                    {ticket.companyName} · {ticket.productType}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Estimate {ticket.internalRefs.estimateId}
                  {ticket.internalRefs.approvalId
                    ? ` · Approval ${ticket.internalRefs.approvalId}`
                    : ""}
                </div>
              </div>
              <div className="mt-2 grid sm:grid-cols-2 gap-1 text-slate-600">
                <div>
                  {ticket.widthIn}&quot; × {ticket.heightIn}&quot; · {ticket.quantity.toLocaleString()} ·{" "}
                  {ticket.colors} colors
                </div>
                <div>
                  {ticket.materialSku} · {ticket.materialName}
                </div>
                <div>
                  Asset: {ticket.recommendedAssetName}
                </div>
                <div>Lane: {ticket.recommendedResource}</div>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Route: {ticket.routeSteps.join(" → ")}
                {ticket.variableData ? " · Variable data" : ""}
                {ticket.finish ? ` · ${ticket.finish}` : ""}
              </div>
              <div className="mt-3">
                {ticket.scheduled ? (
                  <span className="text-xs font-semibold text-emerald-700">On scheduler</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => onSchedule(ticket)}>
                    Place on Gantt
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
