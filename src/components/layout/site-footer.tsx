import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-navy text-white/70 text-sm px-5 md:px-8 py-9">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row gap-y-3 items-center justify-between">
        <div className="flex items-center gap-x-2 text-xs md:text-sm">
          <span>© Summit Graphics</span>
          <span className="hidden md:inline">•</span>
          <span>Sirvoce estimator demo</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
          <Link href="/about" className="hover:text-white">
            About
          </Link>
          <Link href="/contact" className="hover:text-white">
            Contact
          </Link>
          <Link href="/capabilities" className="hover:text-white">
            Capabilities
          </Link>
          <Link href="/quote" className="hover:text-white">
            Get a quote
          </Link>
        </div>
        <div className="text-xs">940-301-3585 • summitgraphics.org</div>
      </div>
    </footer>
  );
}
