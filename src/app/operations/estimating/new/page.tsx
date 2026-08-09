import { redirect } from "next/navigation";
import { CpqWizard } from "@/components/estimating/cpq-wizard";
import { OpsShell } from "@/components/operations/ops-shell";
import { getAppSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function NewEstimatePage() {
  const session = await getAppSession();
  if (!session?.isEmployee || !session.actorRole) {
    redirect("/portal/login?next=/operations/estimating/new");
  }

  return (
    <OpsShell
      title="New estimate"
      subtitle="7-step Memphis CPQ wizard"
      role={session.actorRole}
      actorName={session.profile.full_name}
    >
      <CpqWizard
        sessionRole={session.actorRole}
        sessionName={session.profile.full_name}
      />
    </OpsShell>
  );
}
