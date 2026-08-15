"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRODUCTS } from "@/lib/data/demo-data";
import { ADHESIVES, FINISHES } from "@/lib/data/material-master";
import type { QuoteSpec } from "@/types";

const selectClass =
  "mt-1 flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal";

export function SpecsStep({
  spec,
  onChange,
  internal,
}: {
  spec: QuoteSpec;
  onChange: (next: QuoteSpec) => void;
  internal: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-navy">Product & specs</h2>
        <p className="text-sm text-slate-600 mt-1">
          Enter the job the plant will run. These values drive routing and price.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label>Product type</Label>
          <select
            className={selectClass}
            value={spec.productType}
            onChange={(e) => onChange({ ...spec, productType: e.target.value })}
          >
            {PRODUCTS.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
            {!PRODUCTS.some((p) => p.name === spec.productType) && (
              <option value={spec.productType}>{spec.productType}</option>
            )}
          </select>
        </div>
        <div>
          <Label>Width (in)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            className="mt-1"
            value={spec.widthIn}
            onChange={(e) => onChange({ ...spec, widthIn: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Height (in)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            className="mt-1"
            value={spec.heightIn}
            onChange={(e) => onChange({ ...spec, heightIn: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Quantity</Label>
          <Input
            type="number"
            min="1"
            className="mt-1"
            value={spec.quantity}
            onChange={(e) => onChange({ ...spec, quantity: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Colors</Label>
          <Input
            type="number"
            min="1"
            max="12"
            className="mt-1"
            value={spec.colors}
            onChange={(e) => onChange({ ...spec, colors: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Finish</Label>
          <select
            className={selectClass}
            value={spec.finish ?? "None"}
            onChange={(e) => onChange({ ...spec, finish: e.target.value })}
          >
            <option value="None">None</option>
            {FINISHES.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        {internal && (
          <div>
            <Label>Adhesive</Label>
            <select
              className={selectClass}
              value={spec.adhesive ?? "Permanent Acrylic"}
              onChange={(e) => onChange({ ...spec, adhesive: e.target.value })}
            >
              {ADHESIVES.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <label className="sm:col-span-2 flex items-center gap-2 text-sm rounded-2xl border border-slate-200 px-4 py-3">
          <input
            type="checkbox"
            checked={Boolean(spec.variableData)}
            onChange={(e) => onChange({ ...spec, variableData: e.target.checked })}
          />
          Variable data / serialization required
        </label>
      </div>
    </div>
  );
}
