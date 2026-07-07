"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bot, Menu, X } from "lucide-react";
import { LogoMark } from "@/components/layout/logo-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/quote", label: "Get Quote" },
  { href: "/capabilities", label: "Capabilities" },
  { href: "/ai-tools", label: "AI Tools" },
  { href: "/portal", label: "Customer Portal" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({
  onOpenChat,
}: {
  onOpenChat?: () => void;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-screen-2xl mx-auto">
        <div className="px-5 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-x-2.5">
            <LogoMark />
            <div>
              <div className="font-semibold tracking-tighter text-xl leading-none heading-font">
                Flexible Label Group
              </div>
              <div className="text-[10px] text-slate-500 font-medium -mt-0.5">
                EST 1951 • MEMPHIS
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-x-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-1.5 font-medium transition-colors hover:text-teal",
                  pathname === item.href
                    ? "text-teal font-semibold"
                    : "text-slate-700 hover:text-slate-900"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-x-2">
            <Button variant="outline" onClick={onOpenChat}>
              <Bot className="text-teal" />
              Talk to AI
            </Button>
            <Button asChild variant="cta">
              <Link href="/quote">Get Instant Quote</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/portal">Portal</Link>
            </Button>
          </div>

          <button
            type="button"
            className="md:hidden w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-xl"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t bg-white px-5 py-3">
            <div className="flex flex-col text-sm">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="py-2.5 text-slate-700 font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-y-2 pt-3 mt-2 border-t">
                <Button asChild variant="cta">
                  <Link href="/quote" onClick={() => setMobileOpen(false)}>
                    Get Instant Quote
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => { onOpenChat?.(); setMobileOpen(false); }}>
                  <Bot /> Talk to AI Assistant
                </Button>
                <Button asChild variant="outline">
                  <Link href="/portal" onClick={() => setMobileOpen(false)}>
                    Customer Portal
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
