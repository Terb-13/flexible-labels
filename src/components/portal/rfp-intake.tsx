"use client";

import { useState } from "react";
import { specFromParsed } from "@/components/estimator/wizard-constants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseRfpDocument } from "@/lib/documents/parse-rfp";
import type { QuoteSpec, RfpIntakeItem } from "@/types";

export function RfpIntake({
  onCreate,
}: {
  onCreate: (spec: QuoteSpec, ready: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [items, setItems] = useState<RfpIntakeItem[]>([]);

  function process(source = text) {
    setItems(parseRfpDocument(source));
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-xl">RFP intake</h2>
      <p className="mt-1 text-sm text-slate-500">
        Paste or upload text. Local pattern-match only — no new AI vendor.
      </p>
      <Textarea
        className="mt-4"
        rows={6}
        placeholder='ITEM 1 — Roll labels 2.25 x 3.5 Matte BOPP, 10,000 and 25,000, 4 color process'
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!text.trim()}
          onClick={() => process()}
        >
          Process text
        </Button>
        <label className="inline-flex h-10 cursor-pointer items-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold">
          Upload .txt
          <input
            type="file"
            accept=".txt,.csv,text/plain"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const next = await file.text();
              setText(next);
              process(next);
            }}
          />
        </label>
      </div>
      {items.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="font-mono text-[11px] text-slate-500">
            {items.length} item{items.length === 1 ? "" : "s"} ·{" "}
            {items.filter((i) => i.ready).length} ready ·{" "}
            {items.filter((i) => !i.ready).length} flagged
          </div>
          {items.map((item, i) => (
            <div
              key={`${item.title}-${i}`}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{item.title}</div>
                  {item.customer && (
                    <div className="text-xs text-slate-500">{item.customer}</div>
                  )}
                </div>
                <span
                  className={`status-pill ${
                    item.ready
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {item.ready ? "Ready" : `Needs ${item.missing.join(", ")}`}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.found.map(([k, v]) => (
                  <span key={k} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                    {k}: {v}
                  </span>
                ))}
              </div>
              <Button
                className="mt-3"
                size="sm"
                variant={item.ready ? "cta" : "outline"}
                onClick={() => onCreate(specFromParsed(item.parsed), item.ready)}
              >
                {item.ready ? "Create estimate" : "Open estimator to fill in"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
