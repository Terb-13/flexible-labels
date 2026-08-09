import type {
  ActorRole,
  EstimateStatus,
  EstimateWorkflowAction,
  SavedEstimate,
} from "./estimate-types";

export class WorkflowError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
    this.name = "WorkflowError";
  }
}

export function canPerform(
  action: EstimateWorkflowAction,
  role: ActorRole
): boolean {
  switch (action) {
    case "submit":
    case "reopen":
      return role === "cx" || role === "ep";
    case "claim":
    case "release":
    case "send":
      return role === "ep";
    default:
      return false;
  }
}

export function applyWorkflow(
  estimate: SavedEstimate,
  action: EstimateWorkflowAction,
  role: ActorRole,
  actorName: string
): Partial<SavedEstimate> {
  if (!canPerform(action, role)) {
    throw new WorkflowError(
      `Role ${role.toUpperCase()} cannot perform "${action}".`,
      403
    );
  }

  const now = new Date().toISOString();

  switch (action) {
    case "submit": {
      if (estimate.status !== "draft" && estimate.status !== "estimating") {
        throw new WorkflowError(
          `Cannot submit from status "${estimate.status}".`
        );
      }
      return {
        status: "for_estimate" as EstimateStatus,
        claimedBy: null,
        claimedAt: null,
        lastActorRole: role,
        updatedAt: now,
      };
    }
    case "claim": {
      if (estimate.status !== "for_estimate") {
        throw new WorkflowError("Only queued estimates can be claimed.");
      }
      return {
        status: "estimating",
        claimedBy: actorName,
        claimedAt: now,
        lastActorRole: role,
        updatedAt: now,
      };
    }
    case "release": {
      if (estimate.status !== "estimating") {
        throw new WorkflowError("Only claimed estimates can be released.");
      }
      return {
        status: "for_estimate",
        claimedBy: null,
        claimedAt: null,
        lastActorRole: role,
        updatedAt: now,
      };
    }
    case "send": {
      if (estimate.status !== "estimating") {
        throw new WorkflowError(
          "Claim the estimate before sending to the customer."
        );
      }
      return {
        status: "sent",
        lastActorRole: role,
        shareToken: estimate.shareToken ?? cryptoRandomToken(),
        updatedAt: now,
      };
    }
    case "reopen": {
      if (estimate.status !== "sent") {
        throw new WorkflowError("Only sent estimates can be reopened.");
      }
      return {
        status: "draft",
        claimedBy: null,
        claimedAt: null,
        lastActorRole: role,
        updatedAt: now,
      };
    }
    default:
      throw new WorkflowError(`Unknown action: ${action}`);
  }
}

function cryptoRandomToken(): string {
  const bytes = new Uint8Array(18);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
