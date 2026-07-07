import { Lock } from "lucide-react";
import { DemoLoginForm } from "@/components/portal/demo-login-form";

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "/portal" } = await searchParams;

  return (
    <section className="pt-8 pb-20 px-5 md:px-8 min-h-[70vh] flex items-start justify-center">
      <div className="max-w-lg w-full bg-white border border-slate-200 shadow-sm rounded-3xl px-8 py-9 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-navy flex items-center justify-center mb-6">
          <Lock className="text-white w-7 h-7" />
        </div>
        <div className="font-semibold text-xl">Demo Customer Access</div>
        <div className="text-sm text-slate-600 mt-1">
          Acme Brands — Procurement & Operations
        </div>
        <DemoLoginForm next={next} />
        <div className="mt-4 text-xs text-slate-500">
          Explore every feature. Configure Supabase auth for production credentials.
        </div>
      </div>
    </section>
  );
}
