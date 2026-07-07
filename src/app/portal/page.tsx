import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PortalDashboard } from "@/components/portal/portal-dashboard";
import { getDemoProfile } from "@/lib/auth/demo-session";
import type { UserRole } from "@/types";

export default async function PortalPage() {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get("flg_demo_session")?.value as UserRole | undefined;

  if (!demoRole) {
    redirect("/portal/login");
  }

  const profile = getDemoProfile(demoRole === "employee" ? "customer" : "customer");

  return (
    <section className="pt-8 pb-20 px-5 md:px-8">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-start justify-between mb-6 px-1">
          <div>
            <div className="flex items-center gap-x-3">
              <h1 className="heading-font text-4xl tracking-tighter font-semibold">
                Customer Portal
              </h1>
              <span className="text-xs px-3 py-px bg-emerald-100 text-emerald-700 font-medium rounded-full">
                LIVE DEMO
              </span>
            </div>
            <p className="text-slate-600">
              The exact tools your team will use daily. Clean, fast, and transparent.
            </p>
          </div>
        </div>
        <PortalDashboard
          profile={profile}
          isEmployee={demoRole === "employee"}
        />
      </div>
    </section>
  );
}
