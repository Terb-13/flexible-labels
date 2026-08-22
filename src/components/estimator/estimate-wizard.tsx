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
  STEP_LABELS,
  stepIsValid,
} from "@/components/estimator/wizard-constants";
import { Button } from "@/components/ui/button";
import { materialsForProduct } from "@/lib/pricing/materials";
import type {
  Company,
  Material,
  PricingCatalog,
  QuoteBreakResult,
  QuoteLayoutOption,
  QuoteSpec,
  SavedQuote,
} from "@/types";

export function EstimateWizard({
  spec,
  onChange,
  company,
  materials,
  equipment,
  step,
  onStep,
  artworkUrl,
  onArtwork,
  loading,
  breaks,
  layouts,
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
  equipment: PricingCatalog["equipment"];
  step: number;
  onStep: (step: number) => void;
  artworkUrl: string | null;
  onArtwork: (url: string | null) => void;
  loading: boolean;
  breaks: QuoteBreakResult[];
  layouts: QuoteLayoutOption[];
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
  const filtered = useMemo(
    () => materialsForProduct(spec.product, { materials, equipment }),
    [spec.product, materials, equipment]
  );

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
            <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              {company.is_reseller ? "Reseller" : "DTC"} terms from customer record
            </span>
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
            onPick={(name) => {
              patch({ material: name });
              onStep(2);
            }}
          />
        )}
        {step === 2 && <SizeStep spec={spec} onChange={patch} />}
        {step === 3 && (
          <ColorsStep
            spec={spec}
            artworkUrl={artworkUrl}
            onChange={patch}
            onArtwork={onArtwork}
          />
        )}
        {step === 4 && <SpecsStep spec={spec} onChange={patch} />}
        {step === 5 && <QuantityStep spec={spec} onChange={patch} />}
        {step === 6 && (
          <EstimateStep
            spec={spec}
            loading={loading}
            breaks={breaks}
            layouts={layouts}
            viable={viable}
            onSelectQty={(qty) => patch({ quantity: qty })}
            onSelectAcross={(across) => patch({ across })}
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
            onClick={() => onStep(Math.max(0, step - 1))}
          >
            ← Back
          </Button>
          <Button
            type="button"
            variant="cta"
            disabled={!canContinue}
            onClick={() => canContinue && onStep(step + 1)}
          >
            {step === 5 ? "See Estimate →" : `Continue → ${STEP_LABELS[step + 1] ?? ""}`}
          </Button>
        </div>
      )}
    </div>
  );
}
