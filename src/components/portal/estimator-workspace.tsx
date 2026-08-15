"use client";

import { useEffect, useMemo, useState } from "react";
import { CustomerStep } from "@/components/estimator/steps/customer-step";
import { MaterialStep } from "@/components/estimator/steps/material-step";
import { OutputStep } from "@/components/estimator/steps/output-step";
import { ReviewStep } from "@/components/estimator/steps/review-step";
import { SpecsStep } from "@/components/estimator/steps/specs-step";
import { WizardShell } from "@/components/estimator/wizard-shell";
import {
  CUSTOMER_WIZARD_STEPS,
  INTERNAL_WIZARD_STEPS,
} from "@/components/estimator/wizard-types";
import { QuoteCheckout } from "@/components/quote/quote-checkout";
import { DEMO_COMPANY, DEMO_CUSTOMERS, PRODUCTS } from "@/lib/data/demo-data";
import {
  createEstimate,
  createJobTicket,
  loadCpqSnapshot,
  recordApproval,
} from "@/lib/cpq/store";
import { calculateQuote } from "@/lib/pricing/engine";
import type {
  ApprovalDecision,
  Company,
  JobTicket,
  ParsedDocumentSpec,
  QuoteBreakdown,
  QuoteSpec,
  SavedEstimate,
} from "@/types";
import { useToast } from "@/components/ui/toaster";

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

function specsReady(spec: QuoteSpec): boolean {
  return (
    spec.productType.trim().length > 0 &&
    spec.widthIn > 0 &&
    spec.heightIn > 0 &&
    spec.quantity > 0 &&
    spec.colors > 0
  );
}

export function EstimatorWorkspace({
  showBreakdown = false,
  enableCheckout = false,
  initialProductSlug = null,
  defaultTier = "business",
  actorName = "Morgan Lee",
  onEstimateSaved,
  onTicketCreated,
  onScheduleTicket,
  savedEstimate,
}: {
  showBreakdown?: boolean;
  enableCheckout?: boolean;
  initialProductSlug?: string | null;
  defaultTier?: CustomerTier;
  actorName?: string;
  onEstimateSaved?: (estimate: SavedEstimate) => void;
  onTicketCreated?: (ticket: JobTicket) => void;
  onScheduleTicket?: (ticket: JobTicket) => void;
  savedEstimate?: SavedEstimate | null;
}) {
  const { toast } = useToast();
  const steps = showBreakdown ? INTERNAL_WIZARD_STEPS : CUSTOMER_WIZARD_STEPS;
  const [stepIndex, setStepIndex] = useState(0);
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
  const [previousEstimates, setPreviousEstimates] = useState<SavedEstimate[]>([]);
  const [approvals, setApprovals] = useState<ApprovalDecision[]>([]);
  const [ticket, setTicket] = useState<JobTicket | null>(null);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(
    savedEstimate?.id ?? null
  );

  const company = DEMO_CUSTOMERS.find((c) => c.id === companyId) ?? DEMO_COMPANY;
  const priced = useMemo(() => safeQuote(spec, company), [spec, company]);
  const breakdown = "error" in priced ? null : priced;
  const priceError = "error" in priced ? priced.error : null;
  const currentEstimate = localEstimate ?? savedEstimate ?? null;
  const currentStep = steps[stepIndex];

  function refreshHistory() {
    const snap = loadCpqSnapshot();
    setPreviousEstimates(snap.estimates);
    setApprovals(snap.approvals);
    if (currentEstimate) {
      const found = snap.tickets.find((t) => t.estimateId === currentEstimate.id);
      if (found) setTicket(found);
    }
  }

  useEffect(() => {
    refreshHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  useEffect(() => {
    if (savedEstimate) {
      setLocalEstimate(savedEstimate);
      setSelectedEstimateId(savedEstimate.id);
    }
  }, [savedEstimate]);

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
    setSelectedEstimateId(estimate.id);
    setQuoteSaved(true);
    onEstimateSaved?.(estimate);
    refreshHistory();
    toast(
      estimate.needsApproval
        ? "Estimate saved and sent to the approval queue."
        : "Estimate saved and approved at target margin.",
      !estimate.needsApproval
    );
    if (showBreakdown) {
      setStepIndex(INTERNAL_WIZARD_STEPS.findIndex((s) => s.id === "output"));
    }
  }

  function handleGenerateTicket() {
    if (!currentEstimate) {
      toast("Save the estimate before generating a Job Ticket.");
      return;
    }
    try {
      const next = createJobTicket({ estimateId: currentEstimate.id, actor: actorName });
      setTicket(next);
      setLocalEstimate({ ...currentEstimate, status: "ticketed" });
      onTicketCreated?.(next);
      refreshHistory();
      toast(`Job Ticket ${next.ticketNumber} created.`, true);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Ticket blocked.");
    }
  }

  function handleApprove(decision: "approved" | "rejected", reason: string) {
    if (!currentEstimate) return;
    try {
      recordApproval({
        estimateId: currentEstimate.id,
        decidedBy: actorName,
        decision,
        reason,
      });
      setLocalEstimate({
        ...currentEstimate,
        status: decision === "approved" ? "approved" : "rejected",
      });
      refreshHistory();
      onEstimateSaved?.({
        ...currentEstimate,
        status: decision === "approved" ? "approved" : "rejected",
      });
      toast(
        decision === "approved"
          ? "Approval logged. Job Ticket can be generated."
          : "Rejection logged.",
        decision === "approved"
      );
    } catch (error) {
      toast(error instanceof Error ? error.message : "Approval failed.");
    }
  }

  function handleSelectPrevious(estimate: SavedEstimate) {
    const snap = loadCpqSnapshot();
    setCompanyId(estimate.companyId);
    setSpec(estimate.spec);
    setLocalEstimate(estimate);
    setSelectedEstimateId(estimate.id);
    setQuoteSaved(true);
    setTicket(snap.tickets.find((t) => t.estimateId === estimate.id) ?? null);
    toast(`Loaded ${estimate.id}. Review specs, then continue.`);
  }

  function handleStartBlank() {
    setSpec(productFromSlug(initialProductSlug));
    setLocalEstimate(null);
    setSelectedEstimateId(null);
    setQuoteSaved(false);
    setTicket(null);
    setMissingFields([]);
  }

  const nextDisabled =
    (currentStep?.id === "specs" && !specsReady(spec)) ||
    (currentStep?.id === "material" && !spec.material) ||
    (currentStep?.id === "review" && (!breakdown || Boolean(priceError)));

  const nextLabel =
    currentStep?.id === "review"
      ? showBreakdown
        ? quoteSaved
          ? "Continue to approval"
          : "Save & continue"
        : "Done"
      : "Next";

  function handleNext() {
    if (currentStep?.id === "review") {
      if (showBreakdown) {
        if (!quoteSaved) handleSaveEstimate();
        else setStepIndex((i) => Math.min(i + 1, steps.length - 1));
      }
      return;
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  return (
    <>
      <WizardShell
        steps={steps}
        currentIndex={stepIndex}
        onStepSelect={(index) => {
          if (index <= stepIndex) setStepIndex(index);
        }}
        onBack={() => setStepIndex((i) => Math.max(0, i - 1))}
        onNext={handleNext}
        nextLabel={nextLabel}
        nextDisabled={nextDisabled}
        hideNext={currentStep?.id === "output" || (!showBreakdown && currentStep?.id === "review")}
      >
        {currentStep?.id === "customer" && (
          <CustomerStep
            internal={showBreakdown}
            company={company}
            onCompanyId={setCompanyId}
            previousEstimates={previousEstimates}
            selectedEstimateId={selectedEstimateId}
            onSelectPrevious={handleSelectPrevious}
            onStartBlank={handleStartBlank}
          />
        )}
        {currentStep?.id === "specs" && (
          <SpecsStep spec={spec} onChange={setSpec} internal={showBreakdown} />
        )}
        {currentStep?.id === "material" && (
          <MaterialStep
            spec={spec}
            onChange={setSpec}
            pasteText={pasteText}
            onPasteText={setPasteText}
            parsing={parsing}
            uploadName={uploadName}
            missingFields={missingFields}
            onParse={parseDocument}
          />
        )}
        {currentStep?.id === "review" && (
          <ReviewStep
            internal={showBreakdown}
            company={company}
            spec={spec}
            breakdown={breakdown}
            priceError={priceError}
            quoteSaved={quoteSaved}
            enableCheckout={enableCheckout}
            onSave={handleSaveEstimate}
            onCheckout={() => setCheckoutOpen(true)}
          />
        )}
        {currentStep?.id === "output" && showBreakdown && (
          <OutputStep
            estimate={currentEstimate}
            ticket={ticket}
            approvals={approvals}
            actorName={actorName}
            onApprove={handleApprove}
            onGenerateTicket={handleGenerateTicket}
            onSchedule={(next) => {
              onScheduleTicket?.(next);
              setTicket({ ...next, scheduled: true });
            }}
          />
        )}
      </WizardShell>

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
