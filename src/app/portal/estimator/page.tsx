import { EstimatorWorkspace } from "@/components/portal/estimator-workspace";

export default function PortalEstimatorPage() {
  return (
    <section className="pt-8 pb-20 px-5 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6">
          <h1 className="heading-font text-3xl font-semibold tracking-tighter">
            Simple Estimator
          </h1>
          <p className="text-slate-600 mt-1">
            Upload artwork or paste specs — AI fills the form and shows your final
            price.
          </p>
        </div>
        <EstimatorWorkspace />
      </div>
    </section>
  );
}
