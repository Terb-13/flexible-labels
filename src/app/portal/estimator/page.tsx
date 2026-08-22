import Link from "next/link";
import { EstimatorWorkspace } from "@/components/portal/estimator-workspace";
import { Button } from "@/components/ui/button";
import { getAppSession } from "@/lib/auth/session";
import { listCompanies } from "@/lib/erp/store";
import { loadCatalog, loadCompany } from "@/lib/pricing/catalog";

export default async function PortalEstimatorPage() {
  const [catalog, session, companies] = await Promise.all([
    loadCatalog(),
    getAppSession(),
    listCompanies(),
  ]);
  const locked =
    session.profile?.company_id
      ? ((await loadCompany(session.profile.company_id)) ?? null)
      : null;

  return (
    <section className="pt-8 pb-20 px-5 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="heading-font text-3xl font-semibold tracking-tighter">
              Account Estimator
            </h1>
            <p className="text-slate-600 mt-1">
              Product attributes only. This quote stays on your account.
            </p>
          </div>
          <Button asChild variant="cta">
            <Link href="/quote">Open quote & checkout →</Link>
          </Button>
        </div>
        <EstimatorWorkspace
          enableCheckout
          materials={catalog.materials}
          companies={locked ? [locked] : companies}
          lockedCompany={locked}
          loggedIn
        />
      </div>
    </section>
  );
}
