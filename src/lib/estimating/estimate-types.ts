import type { PricedEstimate } from "./types";

export const ESTIMATE_STATUSES = [
  "draft",
  "for_estimate",
  "estimating",
  "sent",
] as const;

export type EstimateStatus = (typeof ESTIMATE_STATUSES)[number];

export type EstimateWorkflowAction =
  | "submit"
  | "claim"
  | "release"
  | "send"
  | "reopen";

export type ActorRole = "cx" | "ep";

export interface SavedEstimate {
  id: string;
  customerName: string;
  productLabel: string;
  quantity: number;
  pricingMode: string;
  status: EstimateStatus;
  plantCode: string | null;
  plantName: string | null;
  pressName: string | null;
  sellPrice: number;
  sellPricePerM: number;
  payload: PricedEstimate;
  claimedBy: string | null;
  claimedAt: string | null;
  lastActorRole: ActorRole | null;
  shareToken: string | null;
  customerResponse: "accepted" | "request_changes" | null;
  customerResponseNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export function normalizeEstimateStatus(status: string): EstimateStatus {
  if (status === "review") return "for_estimate";
  if ((ESTIMATE_STATUSES as readonly string[]).includes(status)) {
    return status as EstimateStatus;
  }
  return "draft";
}
