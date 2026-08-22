"use client";

import { useState } from "react";
import {
  addCompanyAction,
  approveQuoteAction,
  generateJobTicketAction,
  saveQuoteAction,
} from "@/app/operations/actions";
import { CustomerPicker } from "@/components/estimator/customer-picker";
import { SpecFields, useLiveQuote, DEFAULT_SPEC } from "@/components/portal/estimator-workspace";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { formatCurrency } from "@/lib/pricing/engine";
import type {
  Company,
  Material,
  QuoteSpec,
  SavedQuote,
  ScheduleJob,
} from "@/types";

export function OperationsEstimator({
  companies: initialCompanies,
  materials,
  onJobCreated,
}: {
  companies: Company[];
  materials: Material[];
  onJobCreated?: (job: ScheduleJob) => void;
}) {
  const { toast } = useToast();
  const [companies, setCompanies] = useState(initialCompanies);
  const [companyId, setCompanyId] = useState(initialCompanies[0]?.id ?? "");
  const [spec, setSpec] = useState<QuoteSpec>(DEFAULT_SPEC);
  const [saved, setSaved] = useState<SavedQuote | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const { breakdown, loading } = useLiveQuote(spec, companyId || undefined);

  async function save() {
    if (!companyId) {
      toast("Pick or add a customer first");
      return;
    }
    setBusy("save");
    try {
      const quote = await saveQuoteAction({ companyId, spec });
      setSaved(quote);
      toast(
        quote.needs_approval
          ? "Quote saved — below target margin, approval required"
          : "Quote saved",
        !quote.needs_approval
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not save quote");
    } finally {
      setBusy(null);
    }
  }

  async function approve() {
    if (!saved) return;
    setBusy("approve");
    try {
      const quote = await approveQuoteAction(saved.id);
      setSaved(quote);
      toast("Quote approved", true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not approve quote");
    } finally {
      setBusy(null);
    }
  }

  async function generateJob() {
    if (!saved) {
      toast("Save the quote first");
      return;
    }
    setBusy("job");
    try {
      const job = await generateJobTicketAction(saved.id);
      toast(`Job ${job.job_number} written to the calendar`, true);
      onJobCreated?.(job);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not write job ticket");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <CustomerPicker
          companies={companies}
          companyId={companyId}
          busy={busy === "company"}
          onSelect={(id) => {
            setCompanyId(id);
            setSaved(null);
          }}
          onCreate={async (input) => {
            setBusy("company");
            try {
              const created = await addCompanyAction(input);
              setCompanies((prev) =>
                [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
              );
              setCompanyId(created.id);
              toast(`Added ${created.name}`, true);
            } finally {
              setBusy(null);
            }
          }}
        />
        <SpecFields spec={spec} onChange={(next) => { setSpec(next); setSaved(null); }} materials={materials} />
      </div>

      <div className="border border-slate-200 rounded-3xl p-6 bg-white h-fit lg:sticky lg:top-24">
        <div className="text-xs font-semibold text-slate-500 tracking-wider">
          COST-PLUS ESTIMATE
        </div>
        <div className="text-3xl font-semibold text-navy mt-2">
          {breakdown ? formatCurrency(breakdown.finalPrice, true) : loading ? "…" : "—"}
        </div>
        {breakdown && (
          <>
            <p className="text-xs text-slate-500 mt-2">
              Route {breakdown.routeName}
              {breakdown.catalogSource === "example"
                ? " · EXAMPLE rates — not published plant costs"
                : " · from the plant catalog"}
            </p>
            <p className="text-xs text-slate-600 mt-2">
              {breakdown.productionFeet.toLocaleString("en-US", {
                maximumFractionDigits: 1,
              })}{" "}
              production feet · {breakdown.plannedPressHours.toFixed(2)} planned
              press hours
              {spec.across > 0 && spec.repeatIn > 0
                ? ` · ${spec.across} across · ${spec.repeatIn}" repeat`
                : " · enter repeat and across for press time"}
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <Row
                label={`Substrate${breakdown.substrateCost ? "" : ""}`}
                value={breakdown.substrateCost}
              />
              <Row label="Dye" value={breakdown.dyeCost} />
              {breakdown.lines.map((line) => (
                <div key={line.stage} className="flex justify-between text-slate-600">
                  <span>
                    {line.equipmentName}
                    {!line.qualified ? " (unqualified)" : ""}
                  </span>
                  <span>{formatCurrency(line.cost, true)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total cost</span>
                <span>{formatCurrency(breakdown.totalCost, true)}</span>
              </div>
              <div className="flex justify-between text-teal">
                <span>
                  Margin ({breakdown.marginPercent}%)
                  {breakdown.discountPercent > 0
                    ? ` after ${breakdown.discountPercent}% company discount`
                    : ""}
                </span>
                <span>{formatCurrency(breakdown.marginAmount, true)}</span>
              </div>
            </div>
            {breakdown.needsApproval && (
              <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                Below target margin ({breakdown.targetMarginPercent}%). Approve
                before writing a job ticket.
              </div>
            )}
          </>
        )}

        <div className="mt-4 space-y-2">
          <Button className="w-full" onClick={save} disabled={!breakdown || busy === "save"}>
            {busy === "save" ? "Saving…" : saved ? "Quote saved" : "Save quote"}
          </Button>
          {saved?.needs_approval && saved.status !== "approved" && (
            <Button
              className="w-full"
              variant="outline"
              onClick={approve}
              disabled={busy === "approve"}
            >
              Approve quote
            </Button>
          )}
          <Button
            className="w-full"
            variant="cta"
            onClick={generateJob}
            disabled={!saved || saved.status !== "approved" || busy === "job"}
          >
            {busy === "job" ? "Writing job…" : "Generate job ticket"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span>{formatCurrency(value, true)}</span>
    </div>
  );
}
