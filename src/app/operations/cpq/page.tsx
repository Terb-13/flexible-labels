import Link from "next/link";
import { redirect } from "next/navigation";
import { CpqWizard } from "@/components/estimating/cpq-wizard";
import { OpsShell } from "@/components/operations/ops-shell";
import { getAppSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function CpqPage() {
  const session = await getAppSession();
  if (!session?.isEmployee || !session.actorRole) {
    redirect("/portal/login?next=/operations/cpq");
  }

  return (
    <OpsShell
      title="New estimate (CPQ)"
      subtitle="Full Memphis configure–price–quote wizard · plant MEM-TN"
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
      <CpqWizard
        sessionRole={session.actorRole}
        sessionName={session.profile.full_name}
      />
    </OpsShell>
  );
}
