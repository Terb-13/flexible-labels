"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ActorRole, EstimateStatus } from "@/lib/estimating/estimate-types";

export function WorkflowActions({
  estimateId,
  status,
  role,
  actorName,
  shareToken,
}: {
  estimateId: string;
  status: EstimateStatus;
  role: ActorRole;
  actorName: string;
  shareToken?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(action: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: estimateId, action, actorName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Workflow failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {role === "cx" && status === "draft" && (
          <Button disabled={busy} onClick={() => run("submit")}>
            Send for estimate
          </Button>
        )}
        {role === "ep" && status === "for_estimate" && (
          <Button disabled={busy} onClick={() => run("claim")}>
            Claim
          </Button>
        )}
        {role === "ep" && status === "estimating" && (
          <>
            <Button disabled={busy} onClick={() => run("send")}>
              Send to customer
            </Button>
            <Button
              disabled={busy}
              variant="outline"
              onClick={() => run("release")}
            >
              Release
            </Button>
          </>
        )}
        {(role === "cx" || role === "ep") && status === "sent" && (
          <Button
            disabled={busy}
            variant="outline"
            onClick={() => run("reopen")}
          >
            Reopen as draft
          </Button>
        )}
      </div>
      {shareToken && status === "sent" && (
        <p className="text-sm text-slate-600">
          Customer link:{" "}
          <a
            className="text-teal underline break-all"
            href={`/q/${shareToken}`}
            target="_blank"
            rel="noreferrer"
          >
            /q/{shareToken}
          </a>
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
