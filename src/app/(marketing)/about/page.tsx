import Image from "next/image";

export default function AboutPage() {
  return (
    <section className="pt-8 pb-16 px-5 md:px-8 bg-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-x-12 gap-y-10 items-center">
          <div className="lg:col-span-7">
            <div className="text-teal font-semibold tracking-widest text-sm">
              OUR STORY
            </div>
            <h1 className="heading-font text-4xl md:text-5xl font-semibold tracking-tighter leading-none mt-2">
              We&apos;ve been making labels since before most suppliers existed.
            </h1>
            <div className="max-w-2xl mt-6 text-[15px] space-y-4 text-slate-700">
              <p>
                We know the frustration of waiting days for quotes and proofs, then
                learning the material won&apos;t work.
              </p>
              <p>
                That&apos;s why we built this company around speed, clarity, and real
                expertise — still running presses on the same Memphis floor since
                1951, but now with tools that put you in control.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[
                ["75+", "years continuous production"],
                ["78%", "women-owned"],
                ["100%", "manufactured in Memphis"],
              ].map(([stat, label]) => (
                <div key={label} className="border p-4 rounded-3xl">
                  <div className="font-semibold text-lg tracking-tighter">{stat}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-3xl overflow-hidden border border-slate-200">
              <Image
                src="/images/facility.jpg"
                alt="Memphis manufacturing facility"
                width={700}
                height={500}
                className="w-full"
              />
            </div>
            <div className="text-xs px-1 mt-2 text-slate-500">
              Our Memphis presses. Running since 1951.
            </div>
          </div>
        </div>
        <div className="mt-14 bg-slate-50 border border-slate-200 rounded-3xl px-8 py-8">
          <div className="max-w-3xl">
            <div className="uppercase font-semibold text-xs text-teal">
              OUR PHILOSOPHY
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">
              Combine deep manufacturing expertise with modern tools that give our
              customers control.
            </div>
            <div className="mt-4 text-slate-600">
              You deserve a partner who respects your time. That&apos;s what 75 years
              of doing it right looks like today.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
