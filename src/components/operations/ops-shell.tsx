import type { ActorRole } from "@/lib/estimating/estimate-types";

export function OpsShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  role?: ActorRole | null;
  actorName?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="pt-8 pb-20 px-5 md:px-8 bg-slate-50 min-h-screen">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="heading-font text-3xl md:text-4xl tracking-tighter font-semibold">
              {title}
            </h1>
            {subtitle && <p className="text-slate-600 mt-1">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </div>
    </section>
  );
}
