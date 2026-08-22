"use client";

import { useState } from "react";
import { specFromParsed } from "@/components/estimator/wizard-constants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseSpecText } from "@/lib/documents/parse-rfp";
import type { QuoteSpec } from "@/types";

export function SpecPaste({ onApply }: { onApply: (spec: QuoteSpec) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4">
      <button
        type="button"
        className="text-sm font-semibold text-teal"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide spec paste" : "Have a spec? Paste to prefill"}
      </button>
      {open && (
        <div className="mt-3">
          <p className="text-xs text-slate-500">
            Same local parser as operations RFP intake. No new AI vendor.
          </p>
          <Textarea
            className="mt-2"
            rows={3}
            placeholder='e.g. "18,000 matte BOPP roll labels 2.25 x 3.5, 4 colors"'
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button
            className="mt-2"
            variant="outline"
            size="sm"
            disabled={!text.trim()}
            onClick={() => {
              const parsed = parseSpecText(text);
              onApply(specFromParsed(parsed));
            }}
          >
            Prefill wizard
          </Button>
        </div>
      )}
    </div>
  );
}
