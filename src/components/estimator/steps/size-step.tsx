"use client";

import { STEP_SUBTITLES, STEP_TITLES } from "@/components/estimator/wizard-constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuoteSpec } from "@/types";

export function SizeStep({
  spec,
  onChange,
}: {
  spec: QuoteSpec;
  onChange: (patch: Partial<QuoteSpec>) => void;
}) {
  const area = spec.widthIn > 0 && spec.heightIn > 0 ? spec.widthIn * spec.heightIn : 0;

  return (
    <div>
      <h2 className="heading-font text-3xl md:text-4xl font-semibold tracking-tight">
        {STEP_TITLES[2]}
      </h2>
      <p className="mt-2 font-mono text-xs text-slate-500 max-w-xl">
        {STEP_SUBTITLES[2]}
      </p>
      <div className="mt-8 grid max-w-md grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <Label>Width (in)</Label>
          <Input
            type="number"
            step={0.0625}
            min={0}
            className="mt-1 font-mono"
            value={spec.widthIn || ""}
            placeholder="e.g. 2.25"
            onChange={(e) => onChange({ widthIn: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="pb-3 font-mono text-lg text-slate-300">×</div>
        <div>
          <Label>Height (in)</Label>
          <Input
            type="number"
            step={0.0625}
            min={0}
            className="mt-1 font-mono"
            value={spec.heightIn || ""}
            placeholder="e.g. 3.5"
            onChange={(e) => {
              const heightIn = Number(e.target.value) || 0;
              const patch: Partial<QuoteSpec> = { heightIn };
              if (!spec.repeatIn || spec.repeatIn === spec.heightIn) {
                patch.repeatIn = heightIn;
              }
              onChange(patch);
            }}
          />
        </div>
      </div>
      {area > 0 && (
        <div className="mt-5 inline-flex gap-6 rounded-2xl bg-slate-100 px-4 py-3 font-mono text-xs text-slate-500">
          <span>
            Area: <strong className="text-navy">{area.toFixed(2)} sq in</strong>
          </span>
          <span>
            Perimeter:{" "}
            <strong className="text-navy">
              {(2 * (spec.widthIn + spec.heightIn)).toFixed(2)} in
            </strong>
          </span>
        </div>
      )}
      <div className="mt-8 grid max-w-md sm:grid-cols-2 gap-4">
        <div>
          <Label>Repeat (in)</Label>
          <Input
            type="number"
            step={0.0625}
            min={0}
            className="mt-1 font-mono"
            value={spec.repeatIn || ""}
            onChange={(e) => onChange({ repeatIn: Number(e.target.value) || 0 })}
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Defaults to height. Used for production feet.
          </p>
        </div>
        <div>
          <Label>Across</Label>
          <Input
            type="number"
            step={1}
            min={1}
            className="mt-1 font-mono"
            value={spec.across || ""}
            onChange={(e) => onChange({ across: Number(e.target.value) || 0 })}
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Labels across the web. Not a machine-width picker.
          </p>
        </div>
      </div>
    </div>
  );
}
