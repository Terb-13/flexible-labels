"use client";

import Image from "next/image";
import Link from "next/link";
import { PRODUCTS } from "@/lib/data/demo-data";
import { Button } from "@/components/ui/button";

export function ProductCatalog() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {PRODUCTS.map((product) => (
        <div
          key={product.id}
          className="product-card border border-slate-200 rounded-3xl overflow-hidden bg-white flex flex-col"
        >
          <Image
            src={product.image}
            alt={product.name}
            width={400}
            height={225}
            className="w-full aspect-video object-cover"
          />
          <div className="p-5 flex-1 flex flex-col min-w-0">
            <div>
              <span className="uppercase text-[10px] tracking-widest font-semibold text-teal">
                {product.categoryLabel}
              </span>
            </div>
            <h3 className="text-xl font-semibold tracking-tight mt-1">
              {product.name}
            </h3>
            <p className="text-sm text-slate-600 mt-1.5">{product.description}</p>
            <div className="mt-3 text-xs flex flex-wrap gap-1">
              {product.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-slate-100 rounded">
                  {tag}
                </span>
              ))}
            </div>
            <div className="text-xs mt-3 text-slate-500">
              Ideal for: {product.idealFor}
            </div>
            <div className="mt-auto pt-4 grid grid-cols-1 gap-2">
              <Button asChild variant="cta" className="w-full whitespace-normal h-auto min-h-11 py-2.5">
                <Link href={`/quote?product=${product.slug}`}>
                  Get Instant Quote
                </Link>
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="whitespace-normal h-auto min-h-9 py-2 text-xs"
                >
                  <Link
                    href={`/ai-tools?prompt=${encodeURIComponent(product.aiPrompt)}`}
                  >
                    Ask AI
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="whitespace-normal h-auto min-h-9 py-2 text-xs"
                >
                  <Link href="/contact">Specialist</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
