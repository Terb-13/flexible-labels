"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MATERIAL_CATALOG,
  SAMPLE_RFP,
} from "@/lib/estimating/materials";
import {
  useWizardStore,
  wizardProductToRegisterType,
  type WizardProductType,
} from "@/lib/estimating/wizard-store";
import type { ActorRole } from "@/lib/estimating/estimate-types";
import type { PricedEstimate } from "@/lib/estimating/types";
import { productTypeLabel } from "@/lib/estimating/product-types";
import { cn } from "@/lib/utils";

const STEPS = [
  "Start",
  "Material",
  "Size",
  "Colors",
  "Specs",
  "Quantity",
  "Estimate",
];

const PRODUCTS: { id: WizardProductType; label: string }[] = [
  { id: "prime_label", label: "Roll / prime labels" },
  { id: "die_cut", label: "Die-cut stickers" },
  { id: "variable_data", label: "Variable data" },
  { id: "bumper", label: "Bumper stickers" },
  { id: "magnet", label: "Magnets" },
];

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function CpqWizard({
  sessionRole,
  sessionName,
}: {
  sessionRole: ActorRole;
  sessionName: string;
}) {
  const router = useRouter();
  const w = useWizardStore();
  const [startMode, setStartMode] = useState<"choose" | "rfp" | "manual">(
    "choose"
  );
  const [rfpText, setRfpText] = useState(SAMPLE_RFP);
  const [parsing, setParsing] = useState(false);
  const [tiers, setTiers] = useState<PricedEstimate[]>([]);
  const [selTier, setSelTier] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const productType = w.productType ?? "prime_label";
  const mats = MATERIAL_CATALOG[productType] ?? MATERIAL_CATALOG.prime_label;
  const mat = mats.find((m) => m.id === w.materialId) ?? mats[0];

  const canGo = (i: number) => {
    if (i <= w.step) return true;
    if (i === 1) return startMode !== "choose";
    if (i === 2) return !!w.materialId;
    return i <= w.step + 1;
  };

  async function parseRfp() {
    setParsing(true);
    setError("");
    try {
      const form = new FormData();
      form.set("text", rfpText);
      const res = await fetch("/api/documents/parse", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      const spec = data.spec ?? data;
      w.applyParsed({
        productType: spec.productType,
        widthIn: spec.widthIn,
        heightIn: spec.heightIn,
        quantity: spec.quantity,
        colors: spec.colors,
        material: spec.material,
      });
      setStartMode("rfp");
      w.setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setParsing(false);
    }
  }

  const estimateInput = useMemo(
    () => ({
      family: mat.family,
      productType: wizardProductToRegisterType(productType),
      quantity: w.quantity,
      dimensions: { widthIn: w.widthIn, lengthIn: w.lengthIn },
      material: {
        id: mat.id,
        name: w.materialLabel ?? mat.label,
        family: mat.family,
        costPerMsi: w.materialCostPerMsi ?? mat.costPerMsi,
      },
      ink: { colors: w.colors },
      finishing: {
        laminate: w.laminate,
        varnish: w.varnish,
        dieCut: w.dieCut,
        rewind: w.rewind,
      },
      marginMultiplier: w.marginMultiplier,
      mode: "tiers" as const,
    }),
    [mat, productType, w]
  );

  async function runEstimate() {
    setError("");
    try {
      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(estimateInput),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Estimate failed");
      const list = data.estimates ?? (data.estimate ? [data.estimate] : []);
      setTiers(list);
      setSelTier(0);
      w.setStep(6);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Estimate failed");
    }
  }

  async function save(status: "draft" | "for_estimate") {
    const priced = tiers[selTier];
    if (!priced) return;
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: w.estimateId ?? undefined,
          customerName: w.customerName || "Walk-in",
          productLabel: productTypeLabel(
            wizardProductToRegisterType(productType)
          ),
          status,
          priced,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      w.setEstimateId(data.estimate.id);
      setMsg(
        status === "for_estimate"
          ? "Sent to estimating queue."
          : `Draft saved (${data.estimate.id}).`
      );
      if (status === "for_estimate") {
        router.push("/operations/queue");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const selected = tiers[selTier];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
      <div className="flex flex-wrap gap-2 mb-6">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            disabled={!canGo(i)}
            onClick={() => canGo(i) && w.setStep(i)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full border",
              w.step === i
                ? "bg-teal/10 border-teal text-teal font-semibold"
                : "border-slate-200 text-slate-500"
            )}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {w.step === 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Start estimate</h2>
          <p className="text-sm text-slate-600">
            Signed in as {sessionName} ({sessionRole.toUpperCase()}). Memphis
            plant is selected automatically.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setStartMode("manual");
                w.setStep(1);
              }}
              className="border rounded-xl p-4 text-left hover:border-teal"
            >
              <div className="font-semibold">Manual entry</div>
              <div className="text-sm text-slate-500 mt-1">
                Walk the CPQ steps yourself
              </div>
            </button>
            <button
              type="button"
              onClick={() => setStartMode("rfp")}
              className="border rounded-xl p-4 text-left hover:border-teal"
            >
              <div className="font-semibold">Paste RFP / RFQ</div>
              <div className="text-sm text-slate-500 mt-1">
                Extract specs from customer text
              </div>
            </button>
          </div>
          {startMode === "rfp" && (
            <div className="space-y-3 pt-2">
              <Label>RFP text</Label>
              <Textarea
                rows={6}
                value={rfpText}
                onChange={(e) => setRfpText(e.target.value)}
              />
              <Button disabled={parsing} onClick={parseRfp}>
                {parsing ? "Parsing…" : "Process RFP"}
              </Button>
            </div>
          )}
          <div>
            <Label>Customer name</Label>
            <Input
              className="mt-1"
              value={w.customerName}
              onChange={(e) => w.setCustomerName(e.target.value)}
              placeholder="Acme Brands"
            />
          </div>
        </div>
      )}

      {w.step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Product & material</h2>
          <div className="flex flex-wrap gap-2">
            {PRODUCTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => w.setProductType(p.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-sm",
                  productType === p.id
                    ? "border-teal bg-teal/10 text-teal"
                    : "border-slate-200"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {mats.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => w.setMaterial(m.id, m.label, m.costPerMsi)}
                className={cn(
                  "border rounded-xl p-3 text-left text-sm",
                  (w.materialId ?? mat.id) === m.id
                    ? "border-teal bg-teal/5"
                    : "border-slate-200"
                )}
              >
                <div className="font-medium">{m.label}</div>
                <div className="text-slate-500">${m.costPerMsi.toFixed(2)}/MSI</div>
              </button>
            ))}
          </div>
          <Button onClick={() => w.setStep(2)}>Continue</Button>
        </div>
      )}

      {w.step === 2 && (
        <div className="space-y-4 max-w-md">
          <h2 className="text-xl font-semibold">Size</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Width (in)</Label>
              <Input
                type="number"
                step="0.01"
                value={w.widthIn}
                onChange={(e) =>
                  w.setSize(Number(e.target.value), w.lengthIn)
                }
              />
            </div>
            <div>
              <Label>Length (in)</Label>
              <Input
                type="number"
                step="0.01"
                value={w.lengthIn}
                onChange={(e) =>
                  w.setSize(w.widthIn, Number(e.target.value))
                }
              />
            </div>
          </div>
          <Button onClick={() => w.setStep(3)}>Continue</Button>
        </div>
      )}

      {w.step === 3 && (
        <div className="space-y-4 max-w-md">
          <h2 className="text-xl font-semibold">Colors</h2>
          <Input
            type="number"
            min={1}
            max={12}
            value={w.colors}
            onChange={(e) => w.setColors(Number(e.target.value))}
          />
          <Button onClick={() => w.setStep(4)}>Continue</Button>
        </div>
      )}

      {w.step === 4 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Finishing</h2>
          {(
            [
              ["laminate", "Laminate"],
              ["varnish", "Varnish"],
              ["dieCut", "Die cut"],
              ["rewind", "Rewind"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={w[key]}
                onChange={(e) => w.setFinishing({ [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
          {sessionRole === "ep" && (
            <div className="max-w-xs">
              <Label>Margin multiplier</Label>
              <Input
                type="number"
                step="0.01"
                value={w.marginMultiplier}
                onChange={(e) =>
                  w.setMarginMultiplier(Number(e.target.value))
                }
              />
            </div>
          )}
          <Button onClick={() => w.setStep(5)}>Continue</Button>
        </div>
      )}

      {w.step === 5 && (
        <div className="space-y-4 max-w-md">
          <h2 className="text-xl font-semibold">Quantity</h2>
          <Input
            type="number"
            min={1}
            value={w.quantity}
            onChange={(e) => w.setQuantity(Number(e.target.value))}
          />
          <Button onClick={runEstimate}>Calculate estimate</Button>
        </div>
      )}

      {w.step === 6 && selected && (
        <div className="space-y-5">
          <h2 className="text-xl font-semibold">Estimate</h2>
          <div className="flex flex-wrap gap-2">
            {tiers.map((t, i) => (
              <button
                key={t.route.productionRouteId ?? i}
                type="button"
                onClick={() => setSelTier(i)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-sm capitalize",
                  selTier === i
                    ? "border-teal bg-teal/10 text-teal"
                    : "border-slate-200"
                )}
              >
                {t.route.tier} · {money(t.sellPrice)}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-xl p-4 space-y-2 text-sm">
              <div className="font-semibold text-base">Sell price</div>
              <div className="text-3xl font-semibold text-navy">
                {money(selected.sellPrice)}
              </div>
              <div className="text-slate-500">
                {money(selected.sellPricePerM)} / M
              </div>
              <div className="pt-2 border-t">
                {selected.route.plant.name}
                <br />
                Press: {selected.route.press.name}
                {selected.route.finishing
                  ? ` · ${selected.route.finishing.name}`
                  : ""}
              </div>
            </div>
            {(sessionRole === "ep" || sessionRole === "cx") && (
              <div className="border rounded-xl p-4 space-y-2 text-sm">
                <div className="font-semibold text-base">
                  {sessionRole === "ep" ? "Cost breakdown" : "Margin summary"}
                </div>
                <div>Total cost: {money(selected.costs.totalCost)}</div>
                <div>
                  Gross margin: {money(selected.grossMargin)} (
                  {selected.grossMarginPct.toFixed(1)}%)
                </div>
                {sessionRole === "ep" &&
                  selected.costs.lines.map((line) => (
                    <div
                      key={line.bucket + line.label}
                      className="flex justify-between text-slate-600"
                    >
                      <span>{line.label}</span>
                      <span>{money(line.amount)}</span>
                    </div>
                  ))}
                {sessionRole === "ep" && (
                  <ul className="pt-2 border-t text-slate-500 list-disc pl-4">
                    {selected.route.rationale.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button disabled={saving} variant="outline" onClick={() => save("draft")}>
              Save draft
            </Button>
            {sessionRole === "cx" && (
              <Button disabled={saving} onClick={() => save("for_estimate")}>
                Send for estimate
              </Button>
            )}
            {sessionRole === "ep" && (
              <Button disabled={saving} onClick={() => save("draft")}>
                Save for claiming in queue
              </Button>
            )}
            <Button variant="outline" onClick={runEstimate}>
              Recalculate
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
    </div>
  );
}
