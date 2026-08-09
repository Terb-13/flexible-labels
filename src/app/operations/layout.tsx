import Link from "next/link";
import { LogoMark } from "@/components/layout/logo-mark";
import { ToastProvider } from "@/components/ui/toaster";
import { logoutDemo } from "@/app/portal/actions";

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-screen-2xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between">
          <Link href="/operations/estimating" className="flex items-center gap-2">
            <LogoMark className="w-8 h-8" />
            <span className="font-semibold text-sm heading-font">
              FLG Operations
            </span>
          </Link>
          <div className="flex gap-4 text-sm items-center">
            <Link
              href="/operations/estimating"
              className="text-slate-600 hover:text-teal"
            >
              Estimating
            </Link>
            <Link
              href="/operations/estimating/queue"
              className="text-slate-600 hover:text-teal"
            >
              Queue
            </Link>
            <Link
              href="/operations/assets"
              className="text-slate-600 hover:text-teal"
            >
              Assets
            </Link>
            <Link href="/operations" className="text-slate-600 hover:text-teal">
              Ops
            </Link>
            <Link href="/portal" className="text-slate-600 hover:text-teal">
              Portal
            </Link>
            <form action={logoutDemo}>
              <button type="submit" className="text-slate-500 hover:text-teal">
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
