"use client";

import { useMemo } from "react";
import { ColorsStep } from "@/components/estimator/steps/colors-step";
import { EstimateStep } from "@/components/estimator/steps/estimate-step";
import { MaterialStep } from "@/components/estimator/steps/material-step";
import { ProductStep } from "@/components/estimator/steps/product-step";
import { QuantityStep } from "@/components/estimator/steps/quantity-step";
import { SizeStep } from "@/components/estimator/steps/size-step";
import { SpecsStep } from "@/components/estimator/steps/specs-step";
import { WizardNav } from "@/components/estimator/wizard-nav";
import {
  canOpenStep,
  nextWizardStep,
  prevWizardStep,
  stepIsValid,
  stepLabel,
} from "@/components/estimator/wizard-constants";
import { Button } from "@/components/ui/button";
import { materialsForProduct } from "@/lib/pricing/materials";
import type {
  Company,
  Material,
  PricingCatalog,
  QuoteBreakResult,
  QuoteSpec,
  SavedQuote,
} from "@/types";

export function EstimateWizard({
  spec,
  onChange,
  company,
  materials,
  materialNamesByProduct,
  equipment = [],
  step,
  onStep,
  artworkUrl,
  onArtwork,
  loading,
  breaks,
  viable,
  mode,
  busy,
  saved,
  onSave,
  onApprove,
  onJob,
  onCheckout,
  onChangeCustomer,
}: {
  spec: QuoteSpec;
  onChange: (spec: QuoteSpec) => void;
  company: Company | null;
  materials: Material[];
  materialNamesByProduct?: Record<string, string[]>;
  equipment?: PricingCatalog["equipment"];
  step: number;
  onStep: (step: number) => void;
  artworkUrl: string | null;
  onArtwork: (url: string | null) => void;
  loading: boolean;
  breaks: QuoteBreakResult[];
  viable: boolean;
  mode: "public" | "employee";
  busy?: string | null;
  saved?: SavedQuote | null;
  onSave: () => void;
  onApprove?: () => void;
  onJob?: () => void;
  onCheckout?: () => void;
  onChangeCustomer?: () => void;
}) {
  const filtered = useMemo(() => {
    const substrates = materials.filter(
      (m) => m.kind === "substrate" && m.active !== false
    );
    const allowed = materialNamesByProduct?.[spec.product];
    if (allowed?.length) {
      const named = substrates.filter((m) => allowed.includes(m.name));
      if (named.length) return named;
    }
    const matched = materialsForProduct(spec.product, { materials, equipment });
    if (matched.length) return matched;
    return substrates;
  }, [spec.product, materials, equipment, materialNamesByProduct]);

  function patch(next: Partial<QuoteSpec>) {
    onChange({ ...spec, ...next });
  }

  const canContinue = stepIsValid(step, spec);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      {company && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div className="text-sm">
            Estimating for <span className="font-semibold">{company.name}</span>
            {mode === "employee" && (
            <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              {company.is_reseller ? "Reseller" : "DTC"} terms from customer record
            </span>
            )}
          </div>
          {onChangeCustomer && (
            <button
              type="button"
              className="font-mono text-[11px] text-teal"
              onClick={onChangeCustomer}
            >
              Change customer
            </button>
          )}
        </div>
      )}
      <WizardNav
        current={step}
        spec={spec}
        mode={mode}
        onGo={(i) => {
          if (canOpenStep(i, step, spec)) onStep(i);
        }}
      />
      <div className="px-5 py-8 md:px-8">
        {step === 0 && (
          <ProductStep
            selected={spec.product}
            onPick={(name) => {
              onChange({
                ...spec,
                product: name,
                material: name === spec.product ? spec.material : "",
              });
              onStep(1);
            }}
          />
        )}
        {step === 1 && (
          <MaterialStep
            materials={filtered}
            selected={spec.material}
            mode={mode}
            onPick={(name) => {
              patch({ material: name });
              onStep(2);
            }}
          />
        )}
        {step === 2 && <SizeStep spec={spec} onChange={patch} mode={mode} />}
        {step === 3 && (
          <ColorsStep
            spec={spec}
            artworkUrl={artworkUrl}
            onChange={patch}
            onArtwork={onArtwork}
            mode={mode}
          />
        )}
        {step === 4 && <SpecsStep spec={spec} onChange={patch} mode={mode} />}
        {step === 5 && <QuantityStep spec={spec} onChange={patch} mode={mode} />}
        {step === 6 && (
          <EstimateStep
            spec={spec}
            loading={loading}
            breaks={breaks}
            viable={viable}
            onSelectQty={(qty) => patch({ quantity: qty })}
            mode={mode}
            busy={busy}
            saved={saved}
            onSave={onSave}
            onApprove={onApprove}
            onJob={onJob}
            onCheckout={onCheckout}
          />
        )}
      </div>
      {step < 6 && (
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur md:px-8">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0}
            onClick={() => onStep(prevWizardStep(step, mode))}
          >
            ← Back
          </Button>
          <Button
            type="button"
            variant="cta"
            disabled={!canContinue}
            onClick={() => canContinue && onStep(nextWizardStep(step, mode))}
          >
            {`Continue → ${stepLabel(nextWizardStep(step, mode), mode)}`}
          </Button>
        </div>
      )}
    </div>
  );
}
