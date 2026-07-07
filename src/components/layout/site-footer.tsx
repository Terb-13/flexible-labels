import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-navy text-white/70 text-sm px-5 md:px-8 py-9">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row gap-y-3 items-center justify-between">
        <div className="flex items-center gap-x-2 text-xs md:text-sm">
          <span>© Flexible Label Group</span>
          <span className="hidden md:inline">•</span>
          <span>Memphis, Tennessee</span>
        </div>
        <div className="flex items-center gap-x-4 text-xs">
          <span>Since 1951</span>
          <span>Women-Owned • HubZone Certified</span>
          <Link href="/portal" className="hover:text-white">
            Portal Login
          </Link>
        </div>
        <div className="text-xs">901-555-0123 • sales@flexiblelabelgroup.com</div>
      </div>
    </footer>
  );
}
