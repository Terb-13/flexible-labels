import Image from "next/image";

export default function AboutPage() {
  return (
    <section className="pt-8 pb-16 px-5 md:px-8 bg-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-x-12 gap-y-10 items-center">
          <div className="lg:col-span-7">
            <div className="text-teal font-semibold tracking-widest text-sm">
              SUMMIT GRAPHICS
            </div>
            <h1 className="heading-font text-4xl md:text-5xl font-semibold tracking-tighter leading-none mt-2">
              Custom packaging, printing, and labels from one source.
            </h1>
            <div className="max-w-2xl mt-6 text-[15px] space-y-4 text-slate-700">
              <p>
                Summit Graphics produces custom packaging, labels, signs, decals,
                and promotional print for businesses that need it done in-house.
              </p>
              <p>
                This Sirvoce demo is not the live brochure at summitgraphics.org.
                The live site is call-only. Buyer UAT asked for a self-serve quote
                door. That is what this app adds.
              </p>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-3xl overflow-hidden border border-slate-200">
              <Image
                src="/images/facility.jpg"
                alt="Print and packaging production"
                width={700}
                height={500}
                className="w-full"
              />
            </div>
            <div className="text-xs px-1 mt-2 text-slate-500">
              Demo photography is placeholder. Plant rates are not published here.
            </div>
          </div>
        </div>
        <div className="mt-14 bg-slate-50 border border-slate-200 rounded-3xl px-8 py-8">
          <div className="max-w-3xl">
            <div className="uppercase font-semibold text-xs text-teal">
              DEMO SCOPE
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">
              Two doors. EXAMPLE catalog. No invented plant dollars.
            </div>
            <div className="mt-4 text-slate-600">
              Customers see sell price only. Employees see the cost-plus stack
              after they sign in at a separate operations URL. Clerk and Stripe
              are not in this stack.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
