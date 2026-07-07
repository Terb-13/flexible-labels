"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MATERIAL_RECOMMENDATIONS } from "@/lib/data/demo-data";
import { Button } from "@/components/ui/button";

export default function CapabilitiesPage() {
  const [app, setApp] = useState("beverage");
  const [env, setEnv] = useState("fridge");
  const [showResult, setShowResult] = useState(false);

  function getRecommendation() {
    setShowResult(true);
  }

  const recKey =
    app === "beverage" && env === "fridge"
      ? "beverage-fridge"
      : env === "uv" || app === "outdoor"
        ? "outdoor"
        : app === "industrial" || env === "chem"
          ? "industrial"
          : "default";
  const rec = MATERIAL_RECOMMENDATIONS[recKey];

  return (
    <section className="pt-8 pb-20 px-5 md:px-8 bg-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-9">
          <div>
            <div className="text-teal font-semibold text-sm tracking-widest">
              WHAT WE PRODUCE
            </div>
            <h1 className="heading-font text-4xl md:text-5xl tracking-tighter font-semibold">
              Precision capabilities.
              <br />
              Practical expertise.
            </h1>
          </div>
          <p className="mt-2 md:mt-0 max-w-md text-slate-600">
            Every job is built on 75 years of real press experience. We know what
            actually works.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="capability-card border border-slate-200 bg-white p-6 rounded-3xl">
            <Image
              src="/images/rolls.jpg"
              alt="Roll Labels"
              width={400}
              height={225}
              className="rounded-2xl w-full aspect-video object-cover mb-4"
            />
            <div className="uppercase text-xs font-semibold tracking-wider text-teal">
              PRIMARY
            </div>
            <h3 className="font-semibold text-2xl tracking-tight mt-1">
              Roll Labels
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              High-speed prime labels, liners, tamper-evident. BOPP, PET, paper up
              to 10 colors.
            </p>
          </div>
          <div className="capability-card border border-slate-200 bg-white p-6 rounded-3xl">
            <Image
              src="/images/hero.jpg"
              alt="Die Cut Stickers"
              width={400}
              height={225}
              className="rounded-2xl w-full aspect-video object-cover mb-4"
            />
            <div className="uppercase text-xs font-semibold tracking-wider text-teal">
              PRODUCT & PROMO
            </div>
            <h3 className="font-semibold text-2xl tracking-tight mt-1">
              Custom Die-Cut Stickers
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Any shape, quantity, or substrate. Perfect for packaging, retail, and
              campaigns.
            </p>
          </div>
          <div className="capability-card border border-slate-200 bg-slate-50 p-6 rounded-3xl flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-2">🛠️</div>
              <div className="font-semibold">Full catalog on the Products page</div>
              <Button asChild className="mt-4">
                <Link href="/products">View all 8 product lines →</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 border border-slate-200 bg-white p-8 rounded-3xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <div className="font-semibold text-xl">Find the right material fast</div>
              <div className="text-slate-600 text-sm">
                Three questions. Practical recommendation backed by 75 years of
                production.
              </div>
            </div>
            <Link
              href="/ai-tools"
              className="text-sm mt-3 md:mt-0 font-semibold text-teal"
            >
              Or ask the full AI →
            </Link>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                APPLICATION
              </label>
              <select
                value={app}
                onChange={(e) => setApp(e.target.value)}
                className="w-full border border-slate-300 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal"
              >
                <option value="beverage">Beverage / Bottles</option>
                <option value="food">Food Packaging</option>
                <option value="industrial">Industrial / Chemical</option>
                <option value="retail">Retail & Promo</option>
                <option value="pharma">Pharma / Medical</option>
                <option value="outdoor">Outdoor / Equipment</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                ENVIRONMENT
              </label>
              <select
                value={env}
                onChange={(e) => setEnv(e.target.value)}
                className="w-full border border-slate-300 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal"
              >
                <option value="indoor">Indoor / Ambient</option>
                <option value="fridge">Refrigerated / Cold</option>
                <option value="heat">High Heat</option>
                <option value="uv">Outdoor / UV</option>
                <option value="chem">Chemical exposure</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                QUANTITY
              </label>
              <select className="w-full border border-slate-300 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal">
                <option>&lt; 2,500</option>
                <option>2,500 – 15,000</option>
                <option>15,000 – 50,000</option>
                <option>50,000+</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button onClick={getRecommendation} className="w-full md:w-auto h-11 px-9">
                Show Recommendation
              </Button>
            </div>
          </div>
          {showResult && (
            <div className="mt-6 border-t pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1">
                  <div className="uppercase text-xs font-semibold text-teal">
                    RECOMMENDED
                  </div>
                  <div className="text-2xl font-semibold tracking-tight">
                    {rec.title}
                  </div>
                  <div className="text-sm text-slate-600 mt-1.5">{rec.why}</div>
                </div>
                <Button asChild variant="outline" className="border-teal text-teal">
                  <Link
                    href={`/ai-tools?prompt=${encodeURIComponent(`Tell me more about ${rec.title}`)}`}
                  >
                    Discuss with AI
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
