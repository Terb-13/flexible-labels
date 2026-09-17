"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MATERIAL_RECOMMENDATIONS } from "@/lib/data/demo-data";
import { Button } from "@/components/ui/button";

export default function CapabilitiesPage() {
  const [app, setApp] = useState("packaging");
  const [showResult, setShowResult] = useState(false);

  const rec = MATERIAL_RECOMMENDATIONS[app] ?? MATERIAL_RECOMMENDATIONS.default;

  return (
    <section className="pt-8 pb-20 px-5 md:px-8 bg-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-9">
          <div>
            <div className="text-teal font-semibold text-sm tracking-widest">
              WHAT WE PRODUCE
            </div>
            <h1 className="heading-font text-4xl md:text-5xl tracking-tighter font-semibold">
              Packaging through serialized print.
            </h1>
          </div>
          <p className="mt-2 md:mt-0 max-w-md text-slate-600">
            Product types from the live Summit site and buyer UAT. Materials
            listed here are EXAMPLE names only.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="capability-card border border-slate-200 bg-white p-6 rounded-3xl">
            <Image
              src="/images/tape.jpg"
              alt="Packaging and kits"
              width={400}
              height={225}
              className="rounded-2xl w-full aspect-video object-cover mb-4"
            />
            <div className="uppercase text-xs font-semibold tracking-wider text-teal">
              PACKAGING
            </div>
            <h3 className="font-semibold text-2xl tracking-tight mt-1">
              Packaging / Kits
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Custom cartons, device kits, inserts, and assembly.
            </p>
          </div>
          <div className="capability-card border border-slate-200 bg-white p-6 rounded-3xl">
            <Image
              src="/images/rolls.jpg"
              alt="Labels"
              width={400}
              height={225}
              className="rounded-2xl w-full aspect-video object-cover mb-4"
            />
            <div className="uppercase text-xs font-semibold tracking-wider text-teal">
              LABELS
            </div>
            <h3 className="font-semibold text-2xl tracking-tight mt-1">Labels</h3>
            <p className="mt-2 text-sm text-slate-600">
              Roll labels and barcodes. Process is the production route.
            </p>
          </div>
          <div className="capability-card border border-slate-200 bg-slate-50 p-6 rounded-3xl flex items-center justify-center">
            <div className="text-center">
              <div className="font-semibold">Full catalog on Products</div>
              <Button asChild className="mt-4">
                <Link href="/products">View all five product types →</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 border border-slate-200 bg-white p-8 rounded-3xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <div className="font-semibold text-xl">EXAMPLE material names</div>
              <div className="text-slate-600 text-sm">
                Not Summit stocks. Not plant rates. Pick a type to see the stub.
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                PRODUCT TYPE
              </label>
              <select
                value={app}
                onChange={(e) => setApp(e.target.value)}
                className="w-full border border-slate-300 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal"
              >
                <option value="packaging">Packaging / Kits</option>
                <option value="labels">Labels</option>
                <option value="signs">Signs</option>
                <option value="decals">Decals</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button onClick={() => setShowResult(true)} className="w-full md:w-auto h-11 px-9">
                Show EXAMPLE name
              </Button>
            </div>
          </div>
          {showResult && (
            <div className="mt-6 border-t pt-6">
              <div className="uppercase text-xs font-semibold text-teal">
                EXAMPLE
              </div>
              <div className="text-2xl font-semibold tracking-tight">{rec.title}</div>
              <div className="text-sm text-slate-600 mt-1.5">{rec.why}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
