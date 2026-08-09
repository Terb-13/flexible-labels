import { promises as fs } from "fs";
import path from "path";
import type { PricedEstimate } from "./types";
import {
  normalizeEstimateStatus,
  type ActorRole,
  type EstimateStatus,
  type EstimateWorkflowAction,
  type SavedEstimate,
} from "./estimate-types";
import { applyWorkflow, WorkflowError } from "./workflow";

const FILE_PATH = path.join(process.cwd(), "data", "estimates.json");

let memory: SavedEstimate[] | null = null;

async function loadAll(): Promise<SavedEstimate[]> {
  if (memory) return memory;
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    memory = JSON.parse(raw) as SavedEstimate[];
    return memory;
  } catch {
    memory = [];
    return memory;
  }
}

async function persist(items: SavedEstimate[]): Promise<void> {
  memory = items;
  try {
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
    await fs.writeFile(FILE_PATH, JSON.stringify(items, null, 2), "utf8");
  } catch {
    // in-memory fallback on read-only FS
  }
}

function newId(): string {
  return `est_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listEstimates(limit = 50): Promise<SavedEstimate[]> {
  const all = await loadAll();
  return all
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

export async function getEstimate(id: string): Promise<SavedEstimate | null> {
  const all = await loadAll();
  return all.find((e) => e.id === id) ?? null;
}

export async function getEstimateByShareToken(
  token: string
): Promise<SavedEstimate | null> {
  const all = await loadAll();
  return all.find((e) => e.shareToken === token && e.status === "sent") ?? null;
}

export async function saveEstimate(input: {
  id?: string;
  customerName?: string;
  productLabel: string;
  status?: EstimateStatus;
  priced: PricedEstimate;
  actorRole?: ActorRole;
}): Promise<SavedEstimate> {
  const all = await loadAll();
  const now = new Date().toISOString();
  const priced = input.priced;

  if (input.id) {
    const idx = all.findIndex((e) => e.id === input.id);
    if (idx < 0) throw new WorkflowError("Estimate not found", 404);
    const existing = all[idx];
    if (existing.status === "sent" && input.status !== "draft") {
      throw new WorkflowError(
        "Sent estimates are locked. Reopen as draft to edit.",
        403
      );
    }
    const updated: SavedEstimate = {
      ...existing,
      customerName: input.customerName ?? existing.customerName,
      productLabel: input.productLabel,
      quantity: priced.input.quantity,
      pricingMode: priced.pricingMode,
      status: input.status
        ? normalizeEstimateStatus(input.status)
        : existing.status,
      plantCode: priced.route.plant.code,
      plantName: priced.route.plant.name,
      pressName: priced.route.press.name,
      sellPrice: priced.sellPrice,
      sellPricePerM: priced.sellPricePerM,
      payload: priced,
      lastActorRole: input.actorRole ?? existing.lastActorRole,
      updatedAt: now,
    };
    all[idx] = updated;
    await persist(all);
    return updated;
  }

  const created: SavedEstimate = {
    id: newId(),
    customerName: input.customerName ?? "",
    productLabel: input.productLabel,
    quantity: priced.input.quantity,
    pricingMode: priced.pricingMode,
    status: input.status ? normalizeEstimateStatus(input.status) : "draft",
    plantCode: priced.route.plant.code,
    plantName: priced.route.plant.name,
    pressName: priced.route.press.name,
    sellPrice: priced.sellPrice,
    sellPricePerM: priced.sellPricePerM,
    payload: priced,
    claimedBy: null,
    claimedAt: null,
    lastActorRole: input.actorRole ?? null,
    shareToken: null,
    customerResponse: null,
    customerResponseNote: null,
    createdAt: now,
    updatedAt: now,
  };
  all.unshift(created);
  await persist(all);
  return created;
}

export async function runEstimateWorkflow(
  id: string,
  action: EstimateWorkflowAction,
  role: ActorRole,
  actorName: string
): Promise<SavedEstimate> {
  const all = await loadAll();
  const idx = all.findIndex((e) => e.id === id);
  if (idx < 0) throw new WorkflowError("Estimate not found", 404);

  const patch = applyWorkflow(all[idx], action, role, actorName);
  const updated = { ...all[idx], ...patch };
  all[idx] = updated;
  await persist(all);
  return updated;
}

export async function updateEstimateStatus(
  id: string,
  status: EstimateStatus,
  role: ActorRole
): Promise<SavedEstimate> {
  const all = await loadAll();
  const idx = all.findIndex((e) => e.id === id);
  if (idx < 0) throw new WorkflowError("Estimate not found", 404);
  all[idx] = {
    ...all[idx],
    status: normalizeEstimateStatus(status),
    lastActorRole: role,
    updatedAt: new Date().toISOString(),
  };
  await persist(all);
  return all[idx];
}

export async function recordCustomerResponse(
  token: string,
  response: "accepted" | "request_changes",
  note?: string
): Promise<SavedEstimate> {
  const all = await loadAll();
  const idx = all.findIndex((e) => e.shareToken === token);
  if (idx < 0) throw new WorkflowError("Share link not found", 404);
  all[idx] = {
    ...all[idx],
    customerResponse: response,
    customerResponseNote: note ?? null,
    updatedAt: new Date().toISOString(),
  };
  await persist(all);
  return all[idx];
}

export async function estimateStats() {
  const all = await loadAll();
  return {
    total: all.length,
    open: all.filter((e) => e.status === "draft").length,
    queue: all.filter((e) => e.status === "for_estimate").length,
    estimating: all.filter((e) => e.status === "estimating").length,
    sent: all.filter((e) => e.status === "sent").length,
  };
}
