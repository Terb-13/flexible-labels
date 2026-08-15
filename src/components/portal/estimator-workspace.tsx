"use client";

import { useMemo, useState } from "react";
import { FileUp, Sparkles } from "lucide-react";
import { CustomerQuotePanel } from "@/components/portal/customer-quote-panel";
import { InternalQuotePanel } from "@/components/portal/internal-quote-panel";
import { QuoteCheckout } from "@/components/quote/quote-checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ADHESIVES, FINISHES, SUBSTRATES } from "@/lib/data/material-master";
import { DEMO_CUSTOMERS, DEMO_COMPANY, PRODUCTS } from "@/lib/data/demo-data";
import { createEstimate, createJobTicket } from "@/lib/cpq/store";
import { calculateQuote } from "@/lib/pricing/engine";
import type {
  Company,
  JobTicket,
  ParsedDocumentSpec,
  QuoteBreakdown,
  QuoteSpec,
  SavedEstimate,
} from "@/types";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const DEFAULT_SPEC: QuoteSpec = {
  productType: "Roll Labels",
  widthIn: 2.25,
  heightIn: 3.5,
  quantity: 10000,
  colors: 4,
  material: "Matte BOPP",
  finish: "None",
  variableData: false,
  adhesive: "Permanent Acrylic",
};

export type CustomerTier = "business" | "reseller";

function productFromSlug(slug: string | null): QuoteSpec {
  if (!slug) return DEFAULT_SPEC;
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) return DEFAULT_SPEC;
  return { ...DEFAULT_SPEC, productType: product.name };
}

function safeQuote(spec: QuoteSpec, company: Company): QuoteBreakdown | { error: string } {
  try {
    return calculateQuote(spec, company);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to price" };
  }
}

export function EstimatorWorkspace({
  showBreakdown = false,
  enableCheckout = false,
  initialProductSlug = null,
  defaultTier = "business",
  actorName = "Morgan Lee",
  onEstimateSaved,
  onTicketCreated,
  savedEstimate,
}: {
  showBreakdown?: boolean;
  enableCheckout?: boolean;
  initialProductSlug?: string | null;
  defaultTier?: CustomerTier;
  actorName?: string;
  onEstimateSaved?: (estimate: SavedEstimate) => void;
  onTicketCreated?: (ticket: JobTicket) => void;
  savedEstimate?: SavedEstimate | null;
}) {
  const { toast } = useToast();
  const [companyId, setCompanyId] = useState(
    defaultTier === "reseller" ? DEMO_CUSTOMERS[1].id : DEMO_COMPANY.id
  );
  const [spec, setSpec] = useState<QuoteSpec>(() => productFromSlug(initialProductSlug));
  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [quoteSaved, setQuoteSaved] = useState(false);
  const [localEstimate, setLocalEstimate] = useState<SavedEstimate | null>(
    savedEstimate ?? null
  );

  const company =
    DEMO_CUSTOMERS.find((c) => c.id === companyId) ?? DEMO_COMPANY;
  const priced = useMemo(() => safeQuote(spec, company), [spec, company]);
  const breakdown = "error" in priced ? null : priced;
  const priceError = "error" in priced ? priced.error : null;
  const currentEstimate = savedEstimate ?? localEstimate;

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
        ...(data.productType ? { productType: data.productType } : {}),
        ...(data.widthIn ? { widthIn: data.widthIn } : {}),
        ...(data.heightIn ? { heightIn: data.heightIn } : {}),
        ...(data.quantity ? { quantity: data.quantity } : {}),
        ...(data.colors ? { colors: data.colors } : {}),
        ...(data.material ? { material: data.material } : {}),
        ...(data.finish ? { finish: data.finish } : {}),
        ...(data.variableData !== undefined ? { variableData: data.variableData } : {}),
      }));

      if (file) setUploadName(file.name);
      toast(
        data.missingFields?.length
          ? `Parsed with ${data.missingFields.length} field(s) needing review.`
          : "Document parsed — specs auto-filled.",
        !data.missingFields?.length
      );
    } catch {
      toast("Could not parse document. No values were invented.");
    } finally {
      setParsing(false);
    }
  }

  function handleSaveEstimate() {
    if (!breakdown) return;
    const estimate = createEstimate({
      companyId: company.id,
      companyName: company.name,
      createdBy: actorName,
      spec,
      breakdown,
    });
    setLocalEstimate(estimate);
    setQuoteSaved(true);
    onEstimateSaved?.(estimate);
    toast(
      estimate.needsApproval
        ? "Estimate saved and sent to the approval queue."
        : "Estimate saved and approved at target margin.",
      !estimate.needsApproval
    );
  }

  function handleGenerateTicket() {
    const estimate = currentEstimate;
    if (!estimate) {
      toast("Save the estimate before generating a Job Ticket.");
      return;
    }
    try {
      const ticket = createJobTicket({ estimateId: estimate.id, actor: actorName });
      onTicketCreated?.(ticket);
      toast(`Job Ticket ${ticket.ticketNumber} created.`, true);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Ticket blocked.");
    }
  }

  const canGenerateTicket = Boolean(
    currentEstimate && currentEstimate.status === "approved"
  );
  const ticketBlockedReason = !currentEstimate
    ? "Save the estimate first."
    : currentEstimate.status === "pending_approval"
      ? "Waiting on a logged approval decision."
      : currentEstimate.status === "rejected"
        ? "This estimate was rejected."
        : currentEstimate.status === "ticketed"
          ? "Job Ticket already generated."
          : undefined;

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {showBreakdown ? (
            <div className="border border-slate-200 rounded-3xl p-6 bg-white">
              <div className="font-semibold mb-1">Customer</div>
              <p className="text-sm text-slate-600 mb-4">
                Margin % and target come from the customer record (Reseller vs Direct).
                The engine never hard-codes those rates.
              </p>
              <select
                className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal"
                value={company.id}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                {DEMO_CUSTOMERS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.is_reseller ? "Reseller" : "Direct"} · {c.margin_percent}% / target{" "}
                    {c.target_margin_percent}%
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-3xl p-6 bg-white">
              <div className="font-semibold mb-1">Who is this quote for?</div>
              <p className="text-sm text-slate-600 mb-4">
                Business customers and resellers see different final prices. Cost and
                margin stay internal.
              </p>
              <div className="inline-flex rounded-2xl border p-0.5 bg-slate-50 text-sm w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCompanyId(DEMO_COMPANY.id)}
                  className={cn(
                    "flex-1 sm:flex-none px-5 py-2 rounded-[14px] text-sm font-semibold transition-colors",
                    company.id === DEMO_COMPANY.id
                      ? "view-toggle-active"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Business / DTC
                </button>
                <button
                  type="button"
                  onClick={() => setCompanyId(DEMO_CUSTOMERS[1].id)}
                  className={cn(
                    "flex-1 sm:flex-none px-5 py-2 rounded-[14px] text-sm font-semibold transition-colors",
                    company.is_reseller
                      ? "view-toggle-active"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Reseller / Wholesale
                </button>
              </div>
            </div>
          )}

          <div className="border border-slate-200 rounded-3xl p-6 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <FileUp className="w-5 h-5 text-teal" />
              <div className="font-semibold">Document Intelligence (optional)</div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Upload a PDF, screenshot, Excel/CSV, or paste text. Clean inputs auto-fill.
              Incomplete inputs return missing fields — critical values are never invented.
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
              <span className="text-sm font-semibold text-center">
                Drop file or click to upload
              </span>
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
                <select
                  className="mt-1 flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal"
                  value={spec.material}
                  onChange={(e) => setSpec({ ...spec, material: e.target.value })}
                >
                  {SUBSTRATES.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Finish</Label>
                <select
                  className="mt-1 flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal"
                  value={spec.finish ?? "None"}
                  onChange={(e) => setSpec({ ...spec, finish: e.target.value })}
                >
                  <option value="None">None</option>
                  {FINISHES.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              {showBreakdown && (
                <div>
                  <Label>Adhesive</Label>
                  <select
                    className="mt-1 flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal"
                    value={spec.adhesive ?? "Permanent Acrylic"}
                    onChange={(e) => setSpec({ ...spec, adhesive: e.target.value })}
                  >
                    {ADHESIVES.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <label className="sm:col-span-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(spec.variableData)}
                  onChange={(e) =>
                    setSpec({ ...spec, variableData: e.target.checked })
                  }
                />
                Variable data / serialization required
              </label>
            </div>
          </div>
        </div>

        {priceError || !breakdown ? (
          <div className="border border-red-200 rounded-3xl p-6 bg-red-50 text-sm text-red-800 h-fit">
            {priceError ?? "Enter valid specs to price."}
          </div>
        ) : showBreakdown ? (
          <InternalQuotePanel
            breakdown={breakdown}
            spec={spec}
            companyName={company.name}
            isReseller={company.is_reseller}
            onSaveEstimate={handleSaveEstimate}
            onGenerateTicket={handleGenerateTicket}
            canGenerateTicket={canGenerateTicket}
            ticketBlockedReason={ticketBlockedReason}
          />
        ) : (
          <CustomerQuotePanel
            breakdown={breakdown}
            spec={spec}
            enableCheckout={enableCheckout}
            onCheckout={() => setCheckoutOpen(true)}
            onRequestQuote={handleSaveEstimate}
            quoteSaved={quoteSaved}
          />
        )}
      </div>

      {checkoutOpen && breakdown && (
        <QuoteCheckout
          spec={spec}
          breakdown={breakdown}
          tier={company.is_reseller ? "reseller" : "business"}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </>
  );
}
