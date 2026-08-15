import type {
  ApprovalDecision,
  EstimateStatus,
  JobTicket,
  QuoteBreakdown,
  QuoteSpec,
  SavedEstimate,
} from "@/types";

const STORAGE_KEY = "flg-cpq-runtime-v1";

export interface CpqSnapshot {
  estimates: SavedEstimate[];
  approvals: ApprovalDecision[];
  tickets: JobTicket[];
}

const memory: CpqSnapshot = {
  estimates: [],
  approvals: [],
  tickets: [],
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadCpqSnapshot(): CpqSnapshot {
  if (!canUseStorage()) return memory;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { estimates: [], approvals: [], tickets: [] };
    const parsed = JSON.parse(raw) as CpqSnapshot;
    return {
      estimates: parsed.estimates ?? [],
      approvals: parsed.approvals ?? [],
      tickets: parsed.tickets ?? [],
    };
  } catch {
    return { estimates: [], approvals: [], tickets: [] };
  }
}

export function saveCpqSnapshot(snapshot: CpqSnapshot): void {
  memory.estimates = snapshot.estimates;
  memory.approvals = snapshot.approvals;
  memory.tickets = snapshot.tickets;
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, "0")}`;
}

export function createEstimate(input: {
  companyId: string;
  companyName: string;
  createdBy: string;
  spec: QuoteSpec;
  breakdown: QuoteBreakdown;
}): SavedEstimate {
  const snapshot = loadCpqSnapshot();
  const status: EstimateStatus = input.breakdown.needsApproval
    ? "pending_approval"
    : "approved";
  const now = new Date().toISOString();
  const estimate: SavedEstimate = {
    id: nextId("EST"),
    companyId: input.companyId,
    companyName: input.companyName,
    createdBy: input.createdBy,
    spec: input.spec,
    breakdown: input.breakdown,
    status,
    needsApproval: input.breakdown.needsApproval,
    createdAt: now,
    updatedAt: now,
  };
  snapshot.estimates = [estimate, ...snapshot.estimates];
  saveCpqSnapshot(snapshot);
  return estimate;
}

export function recordApproval(input: {
  estimateId: string;
  decidedBy: string;
  decision: "approved" | "rejected";
  reason: string;
}): ApprovalDecision {
  const snapshot = loadCpqSnapshot();
  const estimate = snapshot.estimates.find((e) => e.id === input.estimateId);
  if (!estimate) throw new Error("Estimate not found.");
  if (!input.reason.trim()) throw new Error("Approval reason is required.");

  const decision: ApprovalDecision = {
    id: nextId("APR"),
    estimateId: input.estimateId,
    decidedBy: input.decidedBy,
    decidedAt: new Date().toISOString(),
    decision: input.decision,
    reason: input.reason.trim(),
    actualMarginPercent: estimate.breakdown.marginPercent,
    targetMarginPercent: estimate.breakdown.targetMarginPercent,
  };

  snapshot.approvals = [decision, ...snapshot.approvals];
  snapshot.estimates = snapshot.estimates.map((e) =>
    e.id === input.estimateId
      ? {
          ...e,
          status: input.decision === "approved" ? "approved" : "rejected",
          updatedAt: decision.decidedAt,
        }
      : e
  );
  saveCpqSnapshot(snapshot);
  return decision;
}

export function createJobTicket(input: {
  estimateId: string;
  actor: string;
}): JobTicket {
  const snapshot = loadCpqSnapshot();
  const estimate = snapshot.estimates.find((e) => e.id === input.estimateId);
  if (!estimate) throw new Error("Estimate not found.");
  if (estimate.status !== "approved") {
    throw new Error("Only an approved estimate can generate a Job Ticket.");
  }

  const existing = snapshot.tickets.find((t) => t.estimateId === estimate.id);
  if (existing) return existing;

  const approval = snapshot.approvals.find(
    (a) => a.estimateId === estimate.id && a.decision === "approved"
  );

  const ticket: JobTicket = {
    id: nextId("TKT"),
    ticketNumber: `JT-${47000 + (snapshot.tickets.length % 900) + 1}`,
    estimateId: estimate.id,
    companyId: estimate.companyId,
    companyName: estimate.companyName,
    productType: estimate.spec.productType,
    widthIn: estimate.spec.widthIn,
    heightIn: estimate.spec.heightIn,
    quantity: estimate.spec.quantity,
    colors: estimate.spec.colors,
    materialSku: estimate.breakdown.materialSku,
    materialName: estimate.breakdown.materialName,
    finish: estimate.spec.finish,
    variableData: Boolean(estimate.spec.variableData),
    recommendedAssetId: estimate.breakdown.recommendedAssetId,
    recommendedAssetName: estimate.breakdown.recommendedAssetName,
    recommendedResource: estimate.breakdown.recommendedResource,
    routeSteps: estimate.breakdown.routeSteps,
    internalRefs: {
      estimateId: estimate.id,
      approvalId: approval?.id,
      companyId: estimate.companyId,
    },
    createdAt: new Date().toISOString(),
    scheduled: false,
  };

  snapshot.tickets = [ticket, ...snapshot.tickets];
  snapshot.estimates = snapshot.estimates.map((e) =>
    e.id === estimate.id
      ? { ...e, status: "ticketed", updatedAt: ticket.createdAt }
      : e
  );
  saveCpqSnapshot(snapshot);
  void input.actor;
  return ticket;
}

export function markTicketScheduled(ticketId: string): JobTicket {
  const snapshot = loadCpqSnapshot();
  const ticket = snapshot.tickets.find((t) => t.id === ticketId);
  if (!ticket) throw new Error("Job Ticket not found.");
  const next = { ...ticket, scheduled: true };
  snapshot.tickets = snapshot.tickets.map((t) => (t.id === ticketId ? next : t));
  saveCpqSnapshot(snapshot);
  return next;
}
