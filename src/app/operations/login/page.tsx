import { Factory } from "lucide-react";
import { DoorLoginForm } from "@/components/auth/door-login-form";
import { isDemoLoginAllowed } from "@/lib/supabase/config";

export default async function OperationsLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const dest = next?.startsWith("/operations") ? next : "/operations";

  return (
    <section className="pt-8 pb-20 px-5 md:px-8 min-h-[70vh] flex items-start justify-center bg-slate-50">
      <div className="max-w-lg w-full bg-white border border-slate-200 shadow-sm rounded-3xl px-8 py-9 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-navy flex items-center justify-center mb-6">
          <Factory className="text-white w-7 h-7" />
        </div>
        <div className="font-semibold text-xl">Operations</div>
        <div className="text-sm text-slate-600 mt-1">
          Employee sign-in for estimating, job tickets, and the plant calendar.
        </div>
        <DoorLoginForm door="employee" next={dest} allowDemo={isDemoLoginAllowed()} />
        <div className="mt-4 text-xs text-slate-500">
          Production sign-in uses Supabase Auth and profiles.role = employee.
        </div>
      </div>
    </section>
  );
}
