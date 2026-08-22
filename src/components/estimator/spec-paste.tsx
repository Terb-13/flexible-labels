"use client";

import { useState } from "react";
import { specFromParsed } from "@/components/estimator/wizard-constants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ParsedDocumentSpec, QuoteSpec } from "@/types";

export function SpecPaste({
  onApply,
  mode = "public",
}: {
  onApply: (spec: QuoteSpec) => void;
  mode?: "public" | "employee";
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);

  async function applyForm(form: FormData) {
    setBusy(true);
    try {
      const res = await fetch("/api/documents/parse", { method: "POST", body: form });
      const data = (await res.json()) as ParsedDocumentSpec & { error?: string };
      if (!res.ok || data.error) return;
      setMissing(data.missingFields ?? []);
      onApply(specFromParsed(data));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4">
      <button
        type="button"
        className="text-sm font-semibold text-teal"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide spec paste" : "Have a spec? Paste or upload to prefill"}
      </button>
      {open && (
        <div className="mt-3">
          <p className="text-xs text-slate-500">
            {mode === "employee"
              ? "Extends the existing document parser — same path as operations RFP. No new AI vendor."
              : "Paste a spec or upload a text file to prefill the steps."}
          </p>
          <Textarea
            className="mt-2"
            rows={3}
            placeholder='e.g. "18,000 matte BOPP roll labels 2.25 x 3.5, 4 colors"'
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={busy || !text.trim()}
              onClick={() => {
                const form = new FormData();
                form.append("text", text.trim());
                applyForm(form);
              }}
            >
              {busy ? "Parsing…" : "Prefill wizard"}
            </Button>
            <label className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-slate-200 px-4 text-xs font-semibold">
              Upload .txt
              <input
                type="file"
                accept=".txt,.csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const form = new FormData();
                  form.append("file", file);
                  if (text.trim()) form.append("text", text.trim());
                  applyForm(form);
                }}
              />
            </label>
          </div>
          {missing.length > 0 && (
            <p className="mt-2 font-mono text-[11px] text-amber-700">
              Still needed: {missing.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
