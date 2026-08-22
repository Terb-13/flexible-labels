"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Company, CompanyType } from "@/types";

export function CustomerPicker({
  companies,
  companyId,
  onSelect,
  onCreate,
  locked = false,
  busy = false,
  showInternalTerms = true,
}: {
  companies: Company[];
  companyId: string;
  onSelect: (id: string) => void;
  onCreate: (input: {
    name: string;
    type: CompanyType;
    margin_percent: number;
    target_margin_percent: number;
    discount_percent: number;
  }) => Promise<void>;
  locked?: boolean;
  busy?: boolean;
  showInternalTerms?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    type: "dtc" as CompanyType,
    margin_percent: 32,
    target_margin_percent: 28,
    discount_percent: 0,
  });
  const company = companies.find((c) => c.id === companyId) ?? null;

  return (
    <div className="border border-slate-200 rounded-3xl p-6 bg-white">
      <div className="font-semibold mb-1">Customer</div>
      <p className="text-sm text-slate-600 mb-4">
        {locked
          ? "This quote is for your account. Type and discount come from the customer record."
          : "Select an existing company or add one. Type, margin, and discount come from the customer record — not from the estimate form."}
      </p>
      {locked && company ? (
        <div className="text-sm font-medium">{company.name}</div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-teal"
            value={companyId}
            onChange={(e) => onSelect(e.target.value)}
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
      )}
      {company && (
        <div className="mt-3 text-xs text-slate-500">
          Type {company.is_reseller ? "reseller" : "DTC"}
          {showInternalTerms
            ? ` · margin ${company.margin_percent}% · target ${company.target_margin_percent}% · discount ${company.discount_percent}%`
            : company.discount_percent
              ? ` · account discount ${company.discount_percent}%`
              : ""}
        </div>
      )}
      {adding && !locked && (
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label>Name</Label>
            <Input
              className="mt-1"
              value={newCompany.name}
              onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Type</Label>
            <select
              className="mt-1 flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
              value={newCompany.type}
              onChange={(e) =>
                setNewCompany({ ...newCompany, type: e.target.value as CompanyType })
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
              disabled={busy}
              onClick={async () => {
                await onCreate(newCompany);
                setAdding(false);
                setNewCompany({
                  name: "",
                  type: "dtc",
                  margin_percent: 32,
                  target_margin_percent: 28,
                  discount_percent: 0,
                });
              }}
            >
              Save customer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
