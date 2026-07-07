import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EstimatorWorkspace } from "@/components/portal/estimator-workspace";
import {
  DEMO_KPIS,
  DEMO_SCHEDULE_JOBS,
  GANTT_DAYS,
} from "@/lib/data/demo-data";
import { formatCurrency } from "@/lib/pricing/engine";
import { OperationsClient } from "@/components/portal/operations-client";

export default async function OperationsPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("flg_demo_session")?.value;

  if (role !== "employee") {
    redirect("/portal/login?next=/operations");
  }

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
            KPI dashboard, full estimator, production scheduler, job tickets, and
            margin assessment.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            ["YTD VOLUME", formatCurrency(DEMO_KPIS.ytdVolume), `+${DEMO_KPIS.ytdGrowthPercent}% YoY`],
            ["ON-TIME %", `${DEMO_KPIS.onTimePercent}%`, "Above 92% target"],
            ["OPEN INVOICES", formatCurrency(DEMO_KPIS.openInvoicesAmount), `${DEMO_KPIS.openInvoicesCount} pending`],
            ["ACTIVE ORDERS", String(DEMO_KPIS.activeOrders), `${DEMO_KPIS.inProduction} in production`],
            ["AVG LEAD TIME", `${DEMO_KPIS.avgLeadTimeDays} days`, `${DEMO_KPIS.leadTimeDelta} vs prior`],
          ].map(([label, value, sub]) => (
            <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                {label}
              </div>
              <div className="text-2xl font-semibold text-navy mt-1">{value}</div>
              <div className="text-xs text-emerald-600 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        <OperationsClient initialJobs={DEMO_SCHEDULE_JOBS} days={GANTT_DAYS} />

        <div>
          <h2 className="font-semibold text-xl mb-4">Full Estimator (cost breakdown)</h2>
          <EstimatorWorkspace showBreakdown />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-3xl p-6">
            <h3 className="font-semibold mb-3">Plant tracking</h3>
            <ul className="space-y-3 text-sm">
              {[
                ["Press Line 1", "Running — Apex 16oz", "87%"],
                ["Press Line 2", "Setup — Horizon jars", "—"],
                ["Digital Press", "Idle", "—"],
                ["Finishing", "Metro bumpers QC", "62%"],
                ["Rewind / Inspection", "Summit pharma", "91%"],
              ].map(([line, job, util]) => (
                <li key={line} className="flex justify-between border-b pb-2">
                  <div>
                    <div className="font-medium">{line}</div>
                    <div className="text-xs text-slate-500">{job}</div>
                  </div>
                  <div className="text-xs font-semibold text-teal">{util}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border rounded-3xl p-6">
            <h3 className="font-semibold mb-3">Post-production margin assessment</h3>
            <div className="space-y-3 text-sm">
              {[
                ["FLG-47721", "Quoted 32%", "Actual 29.4%", "Material waste +2.1%"],
                ["FLG-47588", "Quoted 32%", "Actual 31.8%", "On target"],
                ["FLG-47402", "Quoted 32%", "Actual 27.2%", "Rush finishing — review"],
              ].map(([order, quoted, actual, note]) => (
                <div key={order} className="border-b pb-2">
                  <div className="font-mono text-xs text-slate-500">{order}</div>
                  <div className="flex gap-4 mt-1">
                    <span>{quoted}</span>
                    <span className="font-semibold">{actual}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
