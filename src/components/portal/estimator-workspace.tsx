"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addPublicCompanyAction, savePublicQuoteAction } from "@/app/quote/actions";
import {
  addCompanyAction,
  approveQuoteAction,
  generateJobTicketAction,
  saveQuoteAction,
} from "@/app/operations/actions";
import { CustomerPicker } from "@/components/estimator/customer-picker";
import { EstimateWizard } from "@/components/estimator/estimate-wizard";
import { SpecPaste } from "@/components/estimator/spec-paste";
import {
  EMPTY_WIZARD_SPEC,
  specFromParsed,
  specFromProductName,
} from "@/components/estimator/wizard-constants";
import { PRODUCTS } from "@/lib/data/demo-data";
import { EXAMPLE_EQUIPMENT } from "@/lib/data/example-catalog";
import type {
  Company,
  Equipment,
  Material,
  QuoteBreakdown,
  QuoteBreakResult,
  QuoteLayoutOption,
  QuoteSpec,
  SavedQuote,
  ScheduleJob,
} from "@/types";
import { QuoteCheckout } from "@/components/quote/quote-checkout";
import { useToast } from "@/components/ui/toaster";

export const DEFAULT_SPEC: QuoteSpec = {
  ...EMPTY_WIZARD_SPEC,
  product: "Roll Labels",
  material: "Matte BOPP",
  widthIn: 2.25,
  heightIn: 3.5,
  quantity: 10000,
  colors: 4,
  repeatIn: 3.5,
  across: 2,
  qtyBreaks: [10000],
};

function productFromSlug(slug: string | null): QuoteSpec {
  if (!slug) return { ...EMPTY_WIZARD_SPEC };
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) return { ...EMPTY_WIZARD_SPEC };
  return specFromProductName(product.name);
}

export { specFromParsed };

export function useLiveQuote(spec: QuoteSpec, companyId?: string) {
  const { estimate, loading } = useLiveEstimate(spec, companyId);
  return { breakdown: estimate.primary, loading };
}

export function useLiveEstimate(spec: QuoteSpec, companyId?: string) {
  const [breaks, setBreaks] = useState<QuoteBreakResult[]>([]);
  const [primary, setPrimary] = useState<QuoteBreakdown | null>(null);
  const [layouts, setLayouts] = useState<QuoteLayoutOption[]>([]);
  const [viable, setViable] = useState(true);
  const [loading, setLoading] = useState(false);

  const ready =
    Boolean(companyId) &&
    Boolean(spec.product) &&
    Boolean(spec.material) &&
    spec.widthIn > 0 &&
    spec.heightIn > 0 &&
    ((spec.qtyBreaks ?? []).some((n) => n > 0) || spec.quantity > 0);

  useEffect(() => {
    if (!ready) {
      setBreaks([]);
      setPrimary(null);
      setLayouts([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/quotes/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...spec, companyId }),
        });
        const data = await res.json();
        setPrimary((data.breakdown as QuoteBreakdown | null) ?? null);
        setBreaks((data.breaks as QuoteBreakResult[]) ?? []);
        setLayouts((data.layouts as QuoteLayoutOption[]) ?? []);
        setViable(data.viable !== false);
      } catch {
        setPrimary(null);
        setBreaks([]);
        setLayouts([]);
        setViable(false);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [spec, companyId, ready]);

  return { estimate: { primary, breaks, layouts, viable }, loading };
}

export function EstimatorWorkspace({
  enableCheckout = false,
  initialProductSlug = null,
  initialSpec,
  initialStep,
  materials = [],
  equipment = EXAMPLE_EQUIPMENT,
  companies: initialCompanies = [],
  lockedCompany = null,
  loggedIn = false,
  mode = "public",
  onJobCreated,
  onQuoteSaved,
  allowChangeCustomer = true,
}: {
  enableCheckout?: boolean;
  initialProductSlug?: string | null;
  initialSpec?: QuoteSpec;
  initialStep?: number;
  materials?: Material[];
  equipment?: Equipment[];
  companies?: Company[];
  lockedCompany?: Company | null;
  loggedIn?: boolean;
  mode?: "public" | "employee";
  onJobCreated?: (job: ScheduleJob) => void;
  onQuoteSaved?: (quote: SavedQuote) => void;
  allowChangeCustomer?: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [companies, setCompanies] = useState(initialCompanies);
  const [companyId, setCompanyId] = useState(lockedCompany?.id ?? "");
  const [spec, setSpec] = useState<QuoteSpec>(
    () => initialSpec ?? productFromSlug(initialProductSlug)
  );
  const [step, setStep] = useState(() => {
    if (initialStep != null) return initialStep;
    return spec.product ? 0 : 0;
  });
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedQuote | null>(null);
  const { estimate, loading } = useLiveEstimate(spec, companyId || undefined);

  const company = useMemo(
    () => companies.find((c) => c.id === companyId) ?? lockedCompany,
    [companies, companyId, lockedCompany]
  );

  const customerReady = Boolean(lockedCompany || companyId);

  function applySpec(next: QuoteSpec) {
    setSpec(next);
    setSaved(null);
  }

  async function persistQuote() {
    if (!companyId) {
      toast("Pick or add a customer first");
      return null;
    }
    setBusy("save");
    try {
      const quote =
        mode === "employee"
          ? await saveQuoteAction({ companyId, spec })
          : await savePublicQuoteAction({ companyId, spec });
      setSaved(quote);
      onQuoteSaved?.(quote);
      toast(
        quote.needs_approval
          ? `Quote ${quote.quote_number} saved — below target margin`
          : `Quote ${quote.quote_number} saved`,
        !quote.needs_approval
      );
      return quote;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not save quote");
      return null;
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {!customerReady ? (
        <CustomerPicker
          companies={companies}
          companyId={companyId}
          locked={Boolean(lockedCompany)}
          showInternalTerms={mode === "employee"}
          allowTermsOnCreate={mode === "employee"}
          busy={busy === "company"}
          onSelect={setCompanyId}
          onCreate={async (input) => {
            setBusy("company");
            try {
              const created =
                mode === "employee"
                  ? await addCompanyAction(input)
                  : await addPublicCompanyAction(input);
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
      ) : (
        <div className="space-y-4">
        <SpecPaste
          onApply={(next) => {
            applySpec(next);
            const ready =
              Boolean(next.product) &&
              Boolean(next.material) &&
              next.widthIn > 0 &&
              next.heightIn > 0 &&
              next.quantity > 0;
            setStep(ready ? 6 : 0);
          }}
        />
        <EstimateWizard
          spec={spec}
          onChange={applySpec}
          company={company}
          materials={materials}
          equipment={equipment}
          step={step}
          onStep={setStep}
          artworkUrl={artworkUrl}
          onArtwork={setArtworkUrl}
          loading={loading}
          breaks={estimate.breaks}
          layouts={estimate.layouts}
          viable={estimate.viable}
          mode={mode}
          busy={busy}
          saved={saved}
          onSave={async () => {
            const quote = await persistQuote();
            if (!quote || mode === "employee") return;
            const dest = `/portal?quote=${encodeURIComponent(quote.quote_number ?? "")}`;
            router.push(loggedIn ? dest : `/portal/login?next=${encodeURIComponent(dest)}`);
          }}
          onApprove={async () => {
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
          }}
          onJob={async () => {
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
          }}
          onCheckout={enableCheckout ? () => setCheckoutOpen(true) : undefined}
          onChangeCustomer={
            allowChangeCustomer && !lockedCompany
              ? () => {
                  setCompanyId("");
                  setSaved(null);
                }
              : undefined
          }
        />
        </div>
      )}

      {checkoutOpen && estimate.primary && (
        <QuoteCheckout
          spec={spec}
          breakdown={estimate.primary}
          companyId={companyId}
          loggedIn={loggedIn}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </>
  );
}
