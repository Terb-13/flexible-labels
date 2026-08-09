"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/operations/cpq", label: "New estimate", primary: true },
  {
    href: "/operations",
    label: "Estimates",
    match: (path: string) =>
      path === "/operations" || path.startsWith("/operations/estimates"),
  },
  { href: "/operations/queue", label: "Queue" },
  { href: "/operations/assets", label: "Assets" },
] as const;

export function OpsHeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 sm:gap-2 text-sm">
      {LINKS.map((link) => {
        const active =
          "match" in link && link.match
            ? link.match(pathname)
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        const primary = "primary" in link && link.primary;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap",
              primary && !active && "bg-teal text-white hover:opacity-90",
              primary && active && "bg-teal text-white ring-2 ring-teal/30",
              !primary &&
                active &&
                "bg-teal/10 text-teal font-semibold",
              !primary && !active && "text-slate-600 hover:bg-slate-100"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
