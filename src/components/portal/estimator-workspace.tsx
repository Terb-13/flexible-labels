"use client";

import { useMemo, useState } from "react";
import { FileUp, Sparkles } from "lucide-react";
import { DEMO_COMPANY } from "@/lib/data/demo-data";
import { calculateQuote, formatCurrency } from "@/lib/pricing/engine";
import type { ParsedDocumentSpec, QuoteSpec } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";

const DEFAULT_SPEC: QuoteSpec = {
  productType: "Roll Labels",
  widthIn: 2.25,
  heightIn: 3.5,
  quantity: 10000,
  colors: 4,
  material: "Matte BOPP",
  variableData: false,
};

export function EstimatorWorkspace({ showBreakdown = false }: { showBreakdown?: boolean }) {
  const { toast } = useToast();
  const [spec, setSpec] = useState<QuoteSpec>(DEFAULT_SPEC);
  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [uploadName, setUploadName] = useState<string | null>(null);

  const breakdown = useMemo(
    () => calculateQuote(spec, DEMO_COMPANY),
    [spec]
  );

  async function parseDocument(file?: File) {
    setParsing(true);
    try {
      const form = new FormData();
      if (file) form.append("file", file);
      if (pasteText.trim()) form.append("text", pasteText.trim());

      const res = await fetch("/api/documents/parse", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as ParsedDocumentSpec;
      setMissingFields(data.missingFields ?? []);

      setSpec((prev) => ({
        ...prev,
        productType: data.productType ?? prev.productType,
        widthIn: data.widthIn ?? prev.widthIn,
        heightIn: data.heightIn ?? prev.heightIn,
        quantity: data.quantity ?? prev.quantity,
        colors: data.colors ?? prev.colors,
        material: data.material ?? prev.material,
        variableData: data.variableData ?? prev.variableData,
      }));

      if (file) setUploadName(file.name);
      toast(
        data.missingFields?.length
          ? `Parsed with ${data.missingFields.length} field(s) needing review.`
          : "Document parsed — specs auto-filled.",
        !data.missingFields?.length
      );
    } catch {
      toast("Could not parse document. Using demo extraction.");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="border border-slate-200 rounded-3xl p-6 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <FileUp className="w-5 h-5 text-teal" />
            <div className="font-semibold">Document Intelligence</div>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Upload PDFs, images, Excel, or paste copy. AI extracts specs and flags
            missing data.
          </p>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 cursor-pointer hover:border-teal transition-colors">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.txt,.csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) parseDocument(f);
              }}
            />
            <Sparkles className="w-8 h-8 text-teal mb-2" />
            <span className="text-sm font-semibold">Drop file or click to upload</span>
            {uploadName && (
              <span className="text-xs text-slate-500 mt-2">{uploadName}</span>
            )}
          </label>
          <div className="mt-4">
            <Label>Paste project details</Label>
            <Textarea
              className="mt-1"
              rows={3}
              placeholder='e.g. "18,000 matte BOPP roll labels 2.25 x 3.5 for refrigerated beverage, 4 colors"'
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <Button
              className="mt-2"
              variant="outline"
              disabled={parsing || !pasteText.trim()}
              onClick={() => parseDocument()}
            >
              {parsing ? "Parsing…" : "Parse pasted text"}
            </Button>
          </div>
          {missingFields.length > 0 && (
            <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <div className="font-semibold mb-1">Missing or uncertain fields</div>
              <ul className="list-disc pl-5 space-y-1">
                {missingFields.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border border-slate-200 rounded-3xl p-6 bg-white space-y-4">
          <div className="font-semibold">Job specifications</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Product type</Label>
              <Input
                className="mt-1"
                value={spec.productType}
                onChange={(e) => setSpec({ ...spec, productType: e.target.value })}
              />
            </div>
            <div>
              <Label>Width (in)</Label>
              <Input
                type="number"
                step="0.01"
                className="mt-1"
                value={spec.widthIn}
                onChange={(e) =>
                  setSpec({ ...spec, widthIn: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Height (in)</Label>
              <Input
                type="number"
                step="0.01"
                className="mt-1"
                value={spec.heightIn}
                onChange={(e) =>
                  setSpec({ ...spec, heightIn: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                className="mt-1"
                value={spec.quantity}
                onChange={(e) =>
                  setSpec({ ...spec, quantity: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Colors</Label>
              <Input
                type="number"
                className="mt-1"
                value={spec.colors}
                onChange={(e) =>
                  setSpec({ ...spec, colors: Number(e.target.value) })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Material</Label>
              <Input
                className="mt-1"
                value={spec.material}
                onChange={(e) => setSpec({ ...spec, material: e.target.value })}
              />
            </div>
            <label className="sm:col-span-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={spec.variableData}
                onChange={(e) =>
                  setSpec({ ...spec, variableData: e.target.checked })
                }
              />
              Variable data / serialization required
            </label>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-3xl p-6 bg-white h-fit">
        <div className="text-xs font-semibold text-slate-500 tracking-wider">
          {showBreakdown ? "FULL ESTIMATE" : "YOUR QUOTE"}
        </div>
        {!showBreakdown ? (
          <>
            <div className="text-4xl font-semibold text-navy mt-2">
              {formatCurrency(breakdown.finalPrice)}
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Final price for {spec.quantity.toLocaleString()} {spec.productType.toLowerCase()}
              . Detailed cost breakdown is available to your FLG account team.
            </p>
            <Button className="mt-6 w-full" variant="cta">
              Request formal quote
            </Button>
          </>
        ) : (
          <>
            <div className="text-3xl font-semibold text-navy mt-2">
              {formatCurrency(breakdown.finalPrice)}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Material" value={breakdown.materialCost} />
              <Row label="Press" value={breakdown.pressCost} />
              <Row label="Finishing" value={breakdown.finishingCost} />
              <Row label="Setup / VDP" value={breakdown.setupCost} />
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total cost</span>
                <span>{formatCurrency(breakdown.totalCost)}</span>
              </div>
              <div className="flex justify-between text-teal">
                <span>Margin ({breakdown.marginPercent}%)</span>
                <span>{formatCurrency(breakdown.marginAmount)}</span>
              </div>
            </div>
            {breakdown.needsApproval && (
              <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                Below target margin ({breakdown.targetMarginPercent}%). Sent to
                discount approval queue.
              </div>
            )}
            <Button className="mt-4 w-full" disabled={breakdown.needsApproval}>
              Generate job ticket
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}
