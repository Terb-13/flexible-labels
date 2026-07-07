import Link from "next/link";
import { LogoMark } from "@/components/layout/logo-mark";
import { ToastProvider } from "@/components/ui/toaster";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-screen-2xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <LogoMark className="w-8 h-8" />
              <span className="font-semibold text-sm heading-font">
                Flexible Label Group
              </span>
            </Link>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/portal/estimator" className="text-slate-600 hover:text-teal">
                Estimator
              </Link>
              <Link href="/" className="text-slate-600 hover:text-teal">
                Back to site
              </Link>
            </div>
          </div>
        </header>
        {children}
      </div>
    </ToastProvider>
  );
}
