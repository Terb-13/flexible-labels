import Link from "next/link";
import { cookies } from "next/headers";
import { LogoMark } from "@/components/layout/logo-mark";
import { ToastProvider } from "@/components/ui/toaster";
import { logoutDemo } from "@/app/portal/actions";
import { OpsHeaderNav } from "@/components/operations/ops-header-nav";
import {
  getDemoProfileFromSession,
  sessionToActorRole,
} from "@/lib/auth/demo-session";

export default async function OperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get("flg_demo_session")?.value;
  const role = sessionToActorRole(session);
  const profile = getDemoProfileFromSession(session);
  const roleLabel =
    role === "ep" ? "E&P" : role === "cx" ? "Sales / CX" : null;

  return (
    <ToastProvider>
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-screen-2xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between gap-4">
          <Link href="/operations" className="flex items-center gap-2 shrink-0">
            <LogoMark className="w-8 h-8" />
            <span className="font-semibold text-sm heading-font hidden sm:inline">
              FLG Operations
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto">
            <OpsHeaderNav />
            {roleLabel && profile && (
              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 shrink-0">
                <span className="truncate max-w-[120px]">
                  {profile.full_name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                  {roleLabel}
                </span>
              </div>
            )}
            <form action={logoutDemo} className="shrink-0">
              <button
                type="submit"
                className="text-sm text-slate-500 hover:text-teal px-1"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </ToastProvider>
  );
}
