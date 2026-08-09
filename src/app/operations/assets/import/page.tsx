import { redirect } from "next/navigation";
import { RegisterImport } from "@/components/admin/register-import";
import { OpsShell } from "@/components/operations/ops-shell";
import { getAppSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AssetsImportPage() {
  const session = await getAppSession();
  if (!session?.isEmployee) {
    redirect("/portal/login?next=/operations/assets/import");
  }

  return (
    <OpsShell
      title="Import asset register"
      subtitle="JSON dry-run + commit into the Memphis register snapshot"
      role={session.actorRole}
      actorName={session.profile.full_name}
    >
      <RegisterImport />
    </OpsShell>
  );
}
