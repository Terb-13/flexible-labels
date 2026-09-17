import { ProductCatalog } from "@/components/products/product-catalog";

export default function ProductsPage() {
  return (
    <section className="pt-8 pb-16 px-5 md:px-8 bg-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-9">
          <div className="text-teal font-semibold text-sm tracking-widest">
            PRODUCT TYPES
          </div>
          <h1 className="heading-font text-4xl md:text-5xl tracking-tighter font-semibold mt-1">
            Packaging, labels, signs, decals, serialized.
          </h1>
          <p className="text-slate-600 mt-3 max-w-2xl">
            These are the Summit types from buyer UAT and summitgraphics.org.
            Start a quote from any card. Prices are EXAMPLE until plant rates
            are loaded in Supabase.
          </p>
        </div>

        <ProductCatalog />
      </div>
    </section>
  );
}
