import { Lock } from "lucide-react";
import { DoorLoginForm } from "@/components/portal/door-login-form";
import { isSupabaseConfigured } from "@/lib/auth/config";

export default async function OperationsLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "/operations" } = await searchParams;
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <section className="pt-8 pb-20 px-5 md:px-8 min-h-[70vh] flex items-start justify-center bg-slate-50">
      <div className="max-w-lg w-full bg-white border border-slate-200 shadow-sm rounded-3xl px-8 py-9 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-navy flex items-center justify-center mb-6">
          <Lock className="text-white w-7 h-7" />
        </div>
        <div className="font-semibold text-xl">FLG Operations</div>
        <div className="text-sm text-slate-600 mt-1">
          {supabaseConfigured
            ? "Employee sign-in. Customer accounts are sent to the portal."
            : "Local preview — Demo FLG Employee only."}
        </div>
        <DoorLoginForm
          door="employee"
          next={next}
          supabaseConfigured={supabaseConfigured}
        />
        <div className="mt-4 text-xs text-slate-500">
          {supabaseConfigured
            ? "Customers who sign in here are redirected to the customer portal."
            : "No customer demo on this door. Production uses Supabase + profiles.role = employee."}
        </div>
      </div>
    </section>
  );
}
