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
          <Link href="/operations" className="flex items-center gap-2">
            <LogoMark className="w-8 h-8" />
            <span className="font-semibold text-sm heading-font">
              FLG Operations
            </span>
          </Link>
        </div>
      </header>
      {children}
    </ToastProvider>
  );
}
