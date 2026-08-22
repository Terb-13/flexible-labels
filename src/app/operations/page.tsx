import { redirect } from "next/navigation";
import { logoutOperations } from "@/app/operations/actions";
import { OperationsClient } from "@/components/portal/operations-client";
import { Button } from "@/components/ui/button";
import { getAppSession } from "@/lib/auth/session";
import {
  listClocks,
  listCompanies,
  listDelayReasons,
  listEquipment,
  listJobs,
  listPlantShifts,
} from "@/lib/erp/store";
import { loadCatalog } from "@/lib/pricing/catalog";

export default async function OperationsPage() {
  const session = await getAppSession();
  if (session.role !== "employee") {
    redirect(session.role === "customer" ? "/portal" : "/operations/login");
  }

  const [companies, equipment, jobs, catalog, clocks, reasons, shifts] =
    await Promise.all([
      listCompanies(),
      listEquipment(),
      listJobs(),
      loadCatalog(),
      listClocks(),
      listDelayReasons(),
      listPlantShifts(),
    ]);

  return (
    <section className="pt-8 pb-20 px-5 md:px-8 bg-slate-50 min-h-screen">
      <div className="max-w-screen-2xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="heading-font text-4xl tracking-tighter font-semibold">
              Business Operations
            </h1>
            <span className="text-xs px-3 py-px bg-amber-100 text-amber-700 font-medium rounded-full">
              EMPLOYEE ONLY
            </span>
          </div>
          <p className="text-slate-600 mt-1">
            Press board, operator clocks, and customer-attribute estimating.
            Press time is footage / EXAMPLE FPM — not published plant speeds.
          </p>
          <form action={logoutOperations} className="mt-3">
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>

        <OperationsClient
          initialJobs={jobs}
          initialClocks={clocks}
          equipment={equipment}
          companies={companies}
          materials={catalog.materials}
          reasons={reasons}
          shifts={shifts}
        />
      </div>
    </section>
  );
}
