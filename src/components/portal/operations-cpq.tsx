"use client";

import { useEffect, useState } from "react";
import { ApprovalQueue } from "@/components/portal/approval-queue";
import { EstimatorWorkspace } from "@/components/portal/estimator-workspace";
import { GanttScheduler } from "@/components/portal/gantt-scheduler";
import { JobTicketPanel } from "@/components/portal/job-ticket-panel";
import { RegistryReference } from "@/components/portal/registry-reference";
import { ticketToScheduleJob } from "@/lib/cpq/job-ticket";
import {
  loadCpqSnapshot,
  markTicketScheduled,
  recordApproval,
} from "@/lib/cpq/store";
import type { ApprovalDecision, JobTicket, SavedEstimate, ScheduleJob } from "@/types";
import { useToast } from "@/components/ui/toaster";

const ACTOR = "Morgan Lee";

export function OperationsCpq({
  initialJobs,
  days,
}: {
  initialJobs: ScheduleJob[];
  days: string[];
}) {
  const { toast } = useToast();
  const [jobs, setJobs] = useState(initialJobs);
  const [estimates, setEstimates] = useState<SavedEstimate[]>([]);
  const [approvals, setApprovals] = useState<ApprovalDecision[]>([]);
  const [tickets, setTickets] = useState<JobTicket[]>([]);
  const [activeEstimate, setActiveEstimate] = useState<SavedEstimate | null>(null);

  function refresh() {
    const snap = loadCpqSnapshot();
    setEstimates(snap.estimates);
    setApprovals(snap.approvals);
    setTickets(snap.tickets);
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleDecide(
    estimateId: string,
    decision: "approved" | "rejected",
    reason: string
  ) {
    try {
      recordApproval({ estimateId, decidedBy: ACTOR, decision, reason });
      refresh();
      toast(
        decision === "approved"
          ? "Approval logged. Job Ticket can be generated."
          : "Rejection logged.",
        decision === "approved"
      );
    } catch (error) {
      toast(error instanceof Error ? error.message : "Approval failed.");
    }
  }

  function handleSchedule(ticket: JobTicket) {
    const next = ticketToScheduleJob(ticket, jobs);
    setJobs((prev) => [next, ...prev.filter((j) => j.id !== next.id)]);
    markTicketScheduled(ticket.id);
    refresh();
    toast(`${ticket.ticketNumber} placed on ${ticket.recommendedResource}.`, true);
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-teal/30 bg-teal/5 p-5 text-sm text-slate-700">
        <div className="font-semibold text-navy mb-1">How the estimating loop works</div>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Walk the wizard: customer → specs → material → priced review → ticket.</li>
          <li>The engine prices from the Material Master and Asset Registry — no hard-coded rates.</li>
          <li>Reseller vs Direct uses that customer&apos;s margin % and target.</li>
          <li>Below-target quotes go to the approval queue. Who / when / why is logged.</li>
          <li>An approved estimate becomes a Job Ticket and can be dropped on the Gantt.</li>
        </ol>
      </div>

      <div>
        <h2 className="font-semibold text-xl mb-4">Estimating wizard</h2>
        <EstimatorWorkspace
          showBreakdown
          actorName={ACTOR}
          savedEstimate={activeEstimate}
          onEstimateSaved={(estimate) => {
            setActiveEstimate(estimate);
            refresh();
          }}
          onTicketCreated={() => refresh()}
          onScheduleTicket={handleSchedule}
        />
      </div>

      <RegistryReference />

      <div className="grid lg:grid-cols-2 gap-6">
        <ApprovalQueue
          estimates={estimates}
          approvals={approvals}
          actorName={ACTOR}
          onDecide={handleDecide}
        />
        <JobTicketPanel tickets={tickets} onSchedule={handleSchedule} />
      </div>

      <div>
        <h2 className="font-semibold text-xl mb-4">Production Gantt Scheduler</h2>
        <GanttScheduler jobs={jobs} days={days} onJobsChange={setJobs} />
      </div>
    </div>
  );
}
