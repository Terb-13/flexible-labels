"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function CustomerQuoteClient({
  token,
  productLabel,
  customerName,
  quantity,
  sellPrice,
  sellPricePerM,
  routeSummary,
  initialResponse,
  initialNote,
}: {
  token: string;
  productLabel: string;
  customerName: string;
  quantity: number;
  sellPrice: number;
  sellPricePerM: number;
  routeSummary: {
    plantName: string;
    pressName: string;
    finishingName?: string;
  };
  initialResponse: "accepted" | "request_changes" | null;
  initialNote: string | null;
}) {
  const [response, setResponse] = useState(initialResponse);
  const [note, setNote] = useState(initialNote ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(next: "accepted" | "request_changes") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/share/${token}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: next, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResponse(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
      <div>
        <div className="text-sm text-slate-500">{customerName || "Customer"}</div>
        <div className="font-semibold text-lg">{productLabel}</div>
        <div className="text-sm text-slate-500">
          {quantity.toLocaleString()} pieces · Produced in {routeSummary.plantName}
        </div>
      </div>
      <div>
        <div className="text-3xl font-semibold text-navy">{money(sellPrice)}</div>
        <div className="text-sm text-slate-500">{money(sellPricePerM)} / M</div>
      </div>

      {response ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800">
          Thanks — you{" "}
          {response === "accepted" ? "accepted this quote" : "requested changes"}
          {note ? `: “${note}”` : "."}
        </div>
      ) : (
        <>
          <Textarea
            placeholder="Optional note for FLG…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => submit("accepted")}>
              Accept quote
            </Button>
            <Button
              disabled={busy}
              variant="outline"
              onClick={() => submit("request_changes")}
            >
              Request changes
            </Button>
          </div>
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
