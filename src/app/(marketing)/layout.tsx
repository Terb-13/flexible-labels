import { MarketingShell } from "@/components/layout/marketing-shell";
import { ToastProvider } from "@/components/ui/toaster";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <MarketingShell>{children}</MarketingShell>
    </ToastProvider>
  );
}
