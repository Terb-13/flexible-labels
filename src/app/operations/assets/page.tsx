import Link from "next/link";
import { redirect } from "next/navigation";
import { AssetsClient } from "@/components/admin/assets-client";
import { OpsShell } from "@/components/operations/ops-shell";
import { getAppSession } from "@/lib/auth/session";
import {
  getRegisterSnapshot,
  registerHealth,
} from "@/lib/estimating/register-store";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const session = await getAppSession();
  if (!session?.isEmployee) {
    redirect("/portal/login?next=/operations/assets");
  }

  const snapshot = await getRegisterSnapshot();
  const health = registerHealth(snapshot);

  return (
    <OpsShell
      title="Asset registry"
      subtitle={`${snapshot.plants[0]?.name} · ${health.assets} assets · ${health.routes} routes (synthetic seed — editable)`}
      role={session.actorRole}
      actorName={session.profile.full_name}
    >
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <Link
          href="/operations/assets/import"
          className="text-teal hover:underline"
        >
          Import / reset snapshot →
        </Link>
      </div>
      <AssetsClient initialSnapshot={snapshot} />
    </OpsShell>
  );
}
