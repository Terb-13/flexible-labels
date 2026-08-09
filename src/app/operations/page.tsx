import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DEMO_KPIS,
  DEMO_SCHEDULE_JOBS,
  GANTT_DAYS,
} from "@/lib/data/demo-data";
import { formatCurrency } from "@/lib/pricing/engine";
import { OperationsClient } from "@/components/portal/operations-client";
import { OpsShell } from "@/components/operations/ops-shell";
import { getAppSession } from "@/lib/auth/session";

export default async function OperationsPage() {
  const session = await getAppSession();
  if (!session?.isEmployee) {
    redirect("/portal/login?next=/operations");
  }

  return (
    <OpsShell
      title="Business Operations"
      subtitle="KPI dashboard, Memphis estimating, production scheduler, and margin assessment."
      role={session.actorRole}
      actorName={session.profile.full_name}
    >
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            [
              "YTD VOLUME",
              formatCurrency(DEMO_KPIS.ytdVolume),
              `+${DEMO_KPIS.ytdGrowthPercent}% YoY`,
            ],
            ["ON-TIME %", `${DEMO_KPIS.onTimePercent}%`, "Above 92% target"],
            [
              "OPEN INVOICES",
              formatCurrency(DEMO_KPIS.openInvoicesAmount),
              `${DEMO_KPIS.openInvoicesCount} pending`,
            ],
            [
              "ACTIVE ORDERS",
              String(DEMO_KPIS.activeOrders),
              `${DEMO_KPIS.inProduction} in production`,
            ],
            [
              "AVG LEAD TIME",
              `${DEMO_KPIS.avgLeadTimeDays} days`,
              `${DEMO_KPIS.leadTimeDelta} vs prior`,
            ],
          ].map(([label, value, sub]) => (
            <div
              key={label}
              className="bg-white border border-slate-200 rounded-2xl p-4"
            >
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                {label}
              </div>
              <div className="text-2xl font-semibold text-navy mt-1">
                {value}
              </div>
              <div className="text-xs text-emerald-600 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-teal/30 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-lg">Memphis estimating</h2>
            <p className="text-sm text-slate-600 mt-1">
              Route-based CPQ, asset registry, and CX → E&P queue workflow.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/operations/estimating"
              className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white"
            >
              Open estimating
            </Link>
            <Link
              href="/operations/estimating/new"
              className="rounded-lg border px-4 py-2 text-sm font-medium"
            >
              New estimate
            </Link>
            <Link
              href="/operations/assets"
              className="rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Asset registry
            </Link>
          </div>
        </div>

        <OperationsClient initialJobs={DEMO_SCHEDULE_JOBS} days={GANTT_DAYS} />

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
            <h3 className="font-semibold mb-3">
              Post-production margin assessment
            </h3>
            <div className="space-y-3 text-sm">
              {[
                [
                  "FLG-47721",
                  "Quoted 32%",
                  "Actual 29.4%",
                  "Material waste +2.1%",
                ],
                ["FLG-47588", "Quoted 32%", "Actual 31.8%", "On target"],
                [
                  "FLG-47402",
                  "Quoted 32%",
                  "Actual 27.2%",
                  "Rush finishing — review",
                ],
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
    </OpsShell>
  );
}
