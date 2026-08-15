"use client";

import { FileUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SUBSTRATES } from "@/lib/data/material-master";
import type { QuoteSpec } from "@/types";

const selectClass =
  "mt-1 flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal";

export function MaterialStep({
  spec,
  onChange,
  pasteText,
  onPasteText,
  parsing,
  uploadName,
  missingFields,
  onParse,
}: {
  spec: QuoteSpec;
  onChange: (next: QuoteSpec) => void;
  pasteText: string;
  onPasteText: (value: string) => void;
  parsing: boolean;
  uploadName: string | null;
  missingFields: string[];
  onParse: (file?: File) => void;
}) {
  const selected = SUBSTRATES.find((m) => m.name === spec.material);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-navy">Material & document intake</h2>
        <p className="text-sm text-slate-600 mt-1">
          Choose from the Material Master, or upload a spec. Extracted values can be
          overridden below — critical fields are never invented.
        </p>
      </div>

      <div>
        <Label>Material</Label>
        <select
          className={selectClass}
          value={spec.material}
          onChange={(e) => onChange({ ...spec, material: e.target.value })}
        >
          {SUBSTRATES.map((m) => (
            <option key={m.id} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>
        {selected && (
          <p className="text-xs text-slate-500 mt-2">
            {selected.sku}
            {selected.attributes.description ? ` · ${selected.attributes.description}` : ""}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileUp className="w-5 h-5 text-teal" />
          <div className="font-semibold">Document Intelligence</div>
        </div>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 cursor-pointer hover:border-teal transition-colors">
          <input
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.txt,.csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onParse(f);
            }}
          />
          <Sparkles className="w-7 h-7 text-teal mb-2" />
          <span className="text-sm font-semibold text-center">
            Drop PDF, Excel, screenshot, or click to upload
          </span>
          {uploadName && (
            <span className="text-xs text-slate-500 mt-2">{uploadName}</span>
          )}
        </label>
        <div className="mt-4">
          <Label>Or paste project details</Label>
          <Textarea
            className="mt-1"
            rows={3}
            placeholder='e.g. "18,000 matte BOPP roll labels 2.25 x 3.5, 4 colors"'
            value={pasteText}
            onChange={(e) => onPasteText(e.target.value)}
          />
          <Button
            className="mt-2"
            variant="outline"
            disabled={parsing || !pasteText.trim()}
            onClick={() => onParse()}
          >
            {parsing ? "Parsing…" : "Parse pasted text"}
          </Button>
        </div>
      </div>

      {missingFields.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <div className="font-semibold mb-1">Missing or uncertain fields</div>
          <p className="text-xs mb-2">
            Override them here or go back to Product & Specs. Nothing was invented.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            {missingFields.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
