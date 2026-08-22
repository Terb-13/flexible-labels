import { Lock } from "lucide-react";
import { DoorLoginForm } from "@/components/auth/door-login-form";
import { isDemoLoginAllowed } from "@/lib/supabase/config";

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const dest = next?.startsWith("/portal") ? next : "/portal";

  return (
    <section className="pt-8 pb-20 px-5 md:px-8 min-h-[70vh] flex items-start justify-center">
      <div className="max-w-lg w-full bg-white border border-slate-200 shadow-sm rounded-3xl px-8 py-9 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-navy flex items-center justify-center mb-6">
          <Lock className="text-white w-7 h-7" />
        </div>
        <div className="font-semibold text-xl">Customer portal</div>
        <div className="text-sm text-slate-600 mt-1">
          Sign in to review proofs, track orders, and pay invoices.
        </div>
        <DoorLoginForm door="customer" next={dest} allowDemo={isDemoLoginAllowed()} />
        <div className="mt-4 text-xs text-slate-500">
          Use the email on your account to sign in.
        </div>
      </div>
    </section>
  );
}
