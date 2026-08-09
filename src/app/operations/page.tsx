import Link from "next/link";
import { redirect } from "next/navigation";
import { OpsShell } from "@/components/operations/ops-shell";
import { getAppSession } from "@/lib/auth/session";
import {
  estimateStats,
  listEstimates,
} from "@/lib/estimating/estimates-store";
import {
  getRegisterSnapshot,
  registerHealth,
} from "@/lib/estimating/register-store";
import { productTypeLabel } from "@/lib/estimating/product-types";

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export const dynamic = "force-dynamic";

export default async function EstimatesHubPage() {
  const session = await getAppSession();
  if (!session?.isEmployee) {
    redirect("/portal/login?next=/operations");
  }

  const [snap, recent, stats] = await Promise.all([
    getRegisterSnapshot(),
    listEstimates(12),
    estimateStats(),
  ]);
  const health = registerHealth(snap);

  return (
    <OpsShell
      title="Estimates"
      subtitle="Memphis CPQ hub · start a quote or open the queue"
      role={session.actorRole}
      actorName={session.profile.full_name}
    >
      <div className="mb-8 rounded-2xl border border-teal/30 bg-white p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-xl">Start a new estimate</h2>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Open the full CPQ wizard to configure product, material, and
            quantity. Pricing routes onto Memphis presses automatically.
          </p>
        </div>
        <Link
          href="/operations/cpq"
          className="inline-flex items-center rounded-lg bg-teal px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          New estimate (CPQ)
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          ["Open drafts", String(stats.open), `${stats.total} total saved`],
          ["In queue", String(stats.queue), "Open queue →"],
          ["With estimators", String(stats.estimating), `${stats.sent} sent`],
          [
            "Production routes",
            String(health.routes),
            `${health.presses} presses · ${health.plants} plant`,
          ],
        ].map(([label, value, detail]) => (
          <div
            key={label}
            className="bg-white border border-slate-200 rounded-2xl p-4"
          >
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              {label}
            </div>
            <div className="text-2xl font-semibold text-navy mt-1">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {label === "In queue" ? (
                <Link href="/operations/queue" className="text-teal">
                  {detail}
                </Link>
              ) : (
                detail
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-semibold mb-3">Recent estimates</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500">
              No saved estimates yet.{" "}
              <Link href="/operations/cpq" className="text-teal underline">
                Start the CPQ wizard
              </Link>{" "}
              to create one.
            </p>
          ) : (
            <ul className="divide-y">
              {recent.map((e) => (
                <li
                  key={e.id}
                  className="py-3 flex justify-between gap-3 text-sm"
                >
                  <div>
                    <Link
                      href={`/operations/estimates/${e.id}`}
                      className="font-medium text-teal hover:underline"
                    >
                      {e.customerName || "Untitled"} · {e.productLabel}
                    </Link>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {e.quantity.toLocaleString()} · {e.status} ·{" "}
                      {e.pressName ?? "—"}
                    </div>
                  </div>
                  <div className="font-semibold whitespace-nowrap">
                    {money(e.sellPrice)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold">Memphis register</h2>
          <p className="text-sm text-slate-600">{snap.plants[0]?.name}</p>
          <dl className="text-sm space-y-1">
            <div className="flex justify-between">
              <dt className="text-slate-500">Assets</dt>
              <dd>{health.assets}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Installed presses</dt>
              <dd>{health.presses}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Active routes</dt>
              <dd>{health.routes}</dd>
            </div>
          </dl>
          <ul className="text-xs text-slate-500 space-y-1 pt-2 border-t">
            {snap.routes.slice(0, 4).map((r) => (
              <li key={r.id}>
                {productTypeLabel(r.productType)} · {r.pressAssetTag}
              </li>
            ))}
          </ul>
          <Link
            href="/operations/assets"
            className="inline-block text-sm text-teal hover:underline pt-1"
          >
            Open asset registry →
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-500">
        Public website “Get Instant Quote” is a separate demo tool. Internal CPQ
        is here.{" "}
        <Link href="/operations/plant" className="text-teal hover:underline">
          Plant schedule & KPIs
        </Link>
      </p>
    </OpsShell>
  );
}
