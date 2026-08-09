import { redirect } from "next/navigation";
import { QueueClient } from "@/components/estimating/queue-client";
import { OpsShell } from "@/components/operations/ops-shell";
import { getAppSession } from "@/lib/auth/session";
import { listEstimates } from "@/lib/estimating/estimates-store";

export const dynamic = "force-dynamic";

export default async function EstimatingQueuePage() {
  const session = await getAppSession();
  if (!session?.isEmployee || !session.actorRole) {
    redirect("/portal/login?next=/operations/estimating/queue");
  }

  const all = await listEstimates(100);
  const items = all.filter(
    (e) => e.status === "for_estimate" || e.status === "estimating"
  );

  return (
    <OpsShell
      title="Estimating queue"
      subtitle="Claim, finalize pricing, and send to the customer"
      role={session.actorRole}
      actorName={session.profile.full_name}
    >
      {session.actorRole === "cx" && (
        <p className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          You are signed in as Sales / CX. Queue actions (claim / send) require
          an Estimating (E&P) login.
        </p>
      )}
      <QueueClient
        items={items}
        role={session.actorRole}
        actorName={session.profile.full_name}
      />
    </OpsShell>
  );
}
