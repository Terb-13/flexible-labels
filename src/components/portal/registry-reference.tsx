"use client";

import { ASSET_REGISTRY } from "@/lib/data/asset-registry";
import { SUBSTRATES } from "@/lib/data/material-master";
import { formatCurrency } from "@/lib/pricing/engine";

export function RegistryReference() {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white border rounded-3xl p-6">
        <h3 className="font-semibold mb-1">Material Master</h3>
        <p className="text-xs text-slate-500 mb-3">
          Live substrate costs. Change these records and every quote recalculates.
        </p>
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead className="text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="pb-2">SKU</th>
                <th className="pb-2">Material</th>
                <th className="pb-2 text-right">$/MSI</th>
              </tr>
            </thead>
            <tbody>
              {SUBSTRATES.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="py-1.5 font-mono text-xs">{m.sku}</td>
                  <td>{m.name}</td>
                  <td className="text-right">{formatCurrency(m.costPerMsi, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white border rounded-3xl p-6">
        <h3 className="font-semibold mb-1">Asset Registry — Memphis</h3>
        <p className="text-xs text-slate-500 mb-3">
          Press and finishing rates used for press time, setup, and routing.
        </p>
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead className="text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="pb-2">Asset</th>
                <th className="pb-2">Model</th>
                <th className="pb-2 text-right">$/hr</th>
              </tr>
            </thead>
            <tbody>
              {ASSET_REGISTRY.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="py-1.5">{a.name}</td>
                  <td className="text-xs text-slate-600">
                    {a.manufacturer} {a.model}
                  </td>
                  <td className="text-right">{formatCurrency(a.hourlyRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
