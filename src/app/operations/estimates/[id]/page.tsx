import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusStepper } from "@/components/estimating/status-stepper";
import { WorkflowActions } from "@/components/estimating/workflow-actions";
import { OpsShell } from "@/components/operations/ops-shell";
import { getAppSession } from "@/lib/auth/session";
import { getEstimate } from "@/lib/estimating/estimates-store";

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export const dynamic = "force-dynamic";

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAppSession();
  if (!session?.isEmployee || !session.actorRole) {
    redirect("/portal/login?next=/operations");
  }

  const { id } = await params;
  const estimate = await getEstimate(id);
  if (!estimate) notFound();

  const priced = estimate.payload;
  const isEp = session.actorRole === "ep";

  return (
    <OpsShell
      title={estimate.customerName || "Estimate"}
      subtitle={`${estimate.productLabel} · ${estimate.id}`}
      role={session.actorRole}
      actorName={session.profile.full_name}
      actions={
        <Link
          href="/operations"
          className="text-sm text-teal hover:underline font-medium"
        >
          ← Back to estimates
        </Link>
      }
    >
      <div className="mb-4">
        <StatusStepper status={estimate.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <div className="text-3xl font-semibold text-navy">
                  {money(estimate.sellPrice)}
                </div>
                <div className="text-sm text-slate-500">
                  {money(estimate.sellPricePerM)} / M ·{" "}
                  {estimate.quantity.toLocaleString()} pcs
                </div>
              </div>
              <div className="text-sm text-slate-600 text-right">
                <div>{estimate.plantName}</div>
                <div>{estimate.pressName}</div>
                <div className="capitalize">
                  {estimate.pricingMode.replace("_", " ")}
                </div>
              </div>
            </div>

            {estimate.customerResponse && (
              <div className="text-sm rounded-xl bg-slate-50 border px-3 py-2">
                Customer response:{" "}
                <span className="font-semibold">
                  {estimate.customerResponse === "accepted"
                    ? "Accepted"
                    : "Requested changes"}
                </span>
                {estimate.customerResponseNote
                  ? ` — ${estimate.customerResponseNote}`
                  : ""}
              </div>
            )}

            <WorkflowActions
              estimateId={estimate.id}
              status={estimate.status}
              role={session.actorRole}
              actorName={session.profile.full_name}
              shareToken={estimate.shareToken}
            />
          </div>

          {isEp && (
            <div className="bg-white border rounded-2xl p-5">
              <h2 className="font-semibold mb-3">Cost breakdown</h2>
              <ul className="space-y-2 text-sm">
                {priced.costs.lines.map((line) => (
                  <li
                    key={line.bucket + line.label}
                    className="flex justify-between border-b pb-1"
                  >
                    <span>{line.label}</span>
                    <span>{money(line.amount)}</span>
                  </li>
                ))}
                <li className="flex justify-between font-semibold pt-2">
                  <span>Total cost</span>
                  <span>{money(priced.costs.totalCost)}</span>
                </li>
                <li className="flex justify-between text-teal">
                  <span>Gross margin</span>
                  <span>
                    {money(priced.grossMargin)} (
                    {priced.grossMarginPct.toFixed(1)}%)
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white border rounded-2xl p-5 space-y-3 text-sm">
          <h2 className="font-semibold">Route</h2>
          <p>{priced.route.plant.name}</p>
          <p>Press: {priced.route.press.name}</p>
          {priced.route.finishing && (
            <p>Finishing: {priced.route.finishing.name}</p>
          )}
          <p>
            Layout: {priced.route.across}-across ·{" "}
            {Math.round(priced.route.runMinutes)} min
          </p>
          {priced.route.finishingSteps && (
            <ol className="list-decimal pl-4 text-slate-600">
              {priced.route.finishingSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          )}
          {isEp && (
            <ul className="pt-2 border-t text-slate-500 list-disc pl-4">
              {priced.route.rationale.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          <Link
            href="/operations/cpq"
            className="inline-block text-teal hover:underline pt-2 font-medium"
          >
            New estimate (CPQ) →
          </Link>
        </div>
      </div>
    </OpsShell>
  );
}
