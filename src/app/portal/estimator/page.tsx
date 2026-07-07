import Link from "next/link";
import { EstimatorWorkspace } from "@/components/portal/estimator-workspace";
import { Button } from "@/components/ui/button";

export default function PortalEstimatorPage() {
  return (
    <section className="pt-8 pb-20 px-5 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="heading-font text-3xl font-semibold tracking-tighter">
              Account Estimator
            </h1>
            <p className="text-slate-600 mt-1">
              Saved quotes and reorder specs for your account team.
            </p>
          </div>
          <Button asChild variant="cta">
            <Link href="/quote">Open public quote & checkout →</Link>
          </Button>
        </div>
        <EstimatorWorkspace enableCheckout />
      </div>
    </section>
  );
}
