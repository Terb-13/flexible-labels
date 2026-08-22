"use client";

import Image from "next/image";
import { STEP_SUBTITLES, STEP_TITLES } from "@/components/estimator/wizard-constants";
import { PRODUCTS } from "@/lib/data/demo-data";
import { PRODUCT_OPTIONS } from "@/lib/data/example-catalog";
import { cn } from "@/lib/utils";

export function ProductStep({
  selected,
  onPick,
}: {
  selected: string;
  onPick: (name: string) => void;
}) {
  const products = PRODUCTS.filter((p) => PRODUCT_OPTIONS.includes(p.name));

  return (
    <div>
      <h2 className="heading-font text-3xl md:text-4xl font-semibold tracking-tight">
        {STEP_TITLES[0]}
      </h2>
      <p className="mt-2 font-mono text-xs text-slate-500 max-w-xl">
        {STEP_SUBTITLES[0]}
      </p>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => {
          const on = selected === product.name;
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onPick(product.name)}
              className={cn(
                "product-card overflow-hidden rounded-3xl border bg-white text-left",
                on ? "border-teal ring-2 ring-teal/20" : "border-slate-200"
              )}
            >
              <Image
                src={product.image}
                alt={product.name}
                width={400}
                height={180}
                className="w-full aspect-[16/8] object-cover"
              />
              <div className="p-4">
                <div className="text-[10px] font-semibold tracking-widest text-teal uppercase">
                  {product.categoryLabel}
                </div>
                <div className="mt-1 font-semibold">{product.name}</div>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {product.description}
                </p>
                {on && (
                  <div className="mt-2 font-mono text-[10px] text-teal uppercase tracking-wider">
                    Selected
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
