"use client";

import { useMemo, useState } from "react";
import {
  addCompanyAction,
  approveQuoteAction,
  generateJobTicketAction,
  saveQuoteAction,
} from "@/app/operations/actions";
import { SpecFields, useLiveQuote, DEFAULT_SPEC } from "@/components/portal/estimator-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { formatCurrency } from "@/lib/pricing/engine";
import type {
  Company,
  CompanyType,
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
  const [adding, setAdding] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    type: "dtc" as CompanyType,
    margin_percent: 32,
    target_margin_percent: 28,
    discount_percent: 0,
  });
  const [spec, setSpec] = useState<QuoteSpec>(DEFAULT_SPEC);
  const [saved, setSaved] = useState<SavedQuote | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const { breakdown, loading } = useLiveQuote(spec, companyId || undefined);
  const company = useMemo(
    () => companies.find((c) => c.id === companyId) ?? null,
    [companies, companyId]
  );

  async function addCompany() {
    setBusy("company");
    try {
      const created = await addCompanyAction(newCompany);
      setCompanies((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setCompanyId(created.id);
      setAdding(false);
      setNewCompany({
        name: "",
        type: "dtc",
        margin_percent: 32,
        target_margin_percent: 28,
        discount_percent: 0,
      });
      toast(`Added ${created.name}`, true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not add company");
    } finally {
      setBusy(null);
    }
  }

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
        <div className="border border-slate-200 rounded-3xl p-6 bg-white">
          <div className="font-semibold mb-1">Customer</div>
          <p className="text-sm text-slate-600 mb-4">
            Select an existing company or add one. Margin and discount load from
            the companies table — they are not entered on the estimate.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-teal"
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                setSaved(null);
              }}
            >
              <option value="">Select a customer…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.is_reseller ? "Reseller" : "DTC"}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" onClick={() => setAdding((v) => !v)}>
              {adding ? "Cancel" : "Add customer"}
            </Button>
          </div>
          {company && (
            <div className="mt-3 text-xs text-slate-500">
              Type {company.is_reseller ? "reseller" : "DTC"} · margin{" "}
              {company.margin_percent}% · target {company.target_margin_percent}% ·
              discount {company.discount_percent}%
            </div>
          )}
          {adding && (
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label>Name</Label>
                <Input
                  className="mt-1"
                  value={newCompany.name}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  className="mt-1 flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                  value={newCompany.type}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      type: e.target.value as CompanyType,
                    })
                  }
                >
                  <option value="dtc">DTC / brand</option>
                  <option value="reseller">Reseller</option>
                </select>
              </div>
              <div>
                <Label>Margin %</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={newCompany.margin_percent}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      margin_percent: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Target margin %</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={newCompany.target_margin_percent}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      target_margin_percent: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Discount %</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={newCompany.discount_percent}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      discount_percent: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  onClick={addCompany}
                  disabled={busy === "company"}
                >
                  Save customer
                </Button>
              </div>
            </div>
          )}
        </div>
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
                ? " · EXAMPLE catalog (seed or replace in Supabase)"
                : " · rates from equipment + materials tables"}
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
