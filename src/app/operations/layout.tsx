import Link from "next/link";
import { LogoMark } from "@/components/layout/logo-mark";
import { ToastProvider } from "@/components/ui/toaster";

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-screen-2xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="w-8 h-8" />
            <span className="font-semibold text-sm heading-font">
              FLG Operations
            </span>
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/portal" className="text-slate-600 hover:text-teal">
              Customer portal
            </Link>
            <Link href="/operations" className="text-teal font-semibold">
              Operations
            </Link>
          </div>
        </div>
      </header>
      {children}
    </ToastProvider>
  );
}
