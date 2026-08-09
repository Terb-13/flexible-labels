"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ActorRole, SavedEstimate } from "@/lib/estimating/estimate-types";

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function QueueClient({
  items,
  role,
  actorName,
}: {
  items: SavedEstimate[];
  role: ActorRole;
  actorName: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function run(id: string, action: string) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch("/api/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, actorName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  if (!items.length) {
    return (
      <p className="text-sm text-slate-500 bg-white border rounded-2xl p-6">
        Queue is empty. CX can submit drafts via{" "}
        <Link href="/operations/cpq" className="text-teal underline">
          New estimate (CPQ)
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="bg-white border border-slate-200 rounded-2xl divide-y">
        {items.map((e) => (
          <li
            key={e.id}
            className="p-4 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <Link
                href={`/operations/estimates/${e.id}`}
                className="font-medium text-teal hover:underline"
              >
                {e.customerName || "Untitled"} · {e.productLabel}
              </Link>
              <div className="text-xs text-slate-500 mt-1">
                {e.quantity.toLocaleString()} pcs · {e.pressName ?? "—"} ·{" "}
                {e.status}
                {e.claimedBy ? ` · claimed by ${e.claimedBy}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="font-semibold">{money(e.sellPrice)}</div>
              {role === "ep" && e.status === "for_estimate" && (
                <Button
                  size="sm"
                  disabled={busyId === e.id}
                  onClick={() => run(e.id, "claim")}
                >
                  Claim
                </Button>
              )}
              {role === "ep" && e.status === "estimating" && (
                <>
                  <Button
                    size="sm"
                    disabled={busyId === e.id}
                    onClick={() => run(e.id, "send")}
                  >
                    Send
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === e.id}
                    onClick={() => run(e.id, "release")}
                  >
                    Release
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
