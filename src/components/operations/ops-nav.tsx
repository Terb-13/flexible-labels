"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/operations/estimating", label: "Estimating" },
  { href: "/operations/estimating/queue", label: "Queue" },
  { href: "/operations/estimating/new", label: "New estimate" },
  { href: "/operations/assets", label: "Assets" },
  { href: "/operations", label: "Ops overview" },
];

export function OpsNav({
  roleLabel,
  actorName,
}: {
  roleLabel?: string;
  actorName?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <nav className="flex flex-wrap gap-1">
        {LINKS.map((link) => {
          const active =
            link.href === "/operations"
              ? pathname === "/operations"
              : pathname === link.href ||
                (link.href !== "/operations/estimating" &&
                  pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-colors",
                active
                  ? "bg-teal/10 text-teal font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      {(roleLabel || actorName) && (
        <div className="text-xs text-slate-500">
          {actorName}
          {roleLabel ? (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
              {roleLabel}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
