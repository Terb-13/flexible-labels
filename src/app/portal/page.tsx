import { redirect } from "next/navigation";
import { PortalDashboard } from "@/components/portal/portal-dashboard";
import { getAppSession } from "@/lib/auth/session";

export default async function PortalPage() {
  const session = await getAppSession();

  if (!session.role) {
    redirect("/portal/login");
  }

  return (
    <section className="pt-8 pb-20 px-5 md:px-8">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-start justify-between mb-6 px-1">
          <div>
            <div className="flex items-center gap-x-3">
              <h1 className="heading-font text-4xl tracking-tighter font-semibold">
                Customer Portal
              </h1>
            </div>
            <p className="text-slate-600">
              Proofs, order tracking, and payments for your account.
            </p>
          </div>
        </div>
        <PortalDashboard profile={session.profile!} />
      </div>
    </section>
  );
}
