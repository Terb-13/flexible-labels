import Link from "next/link";
import { ProductCatalog } from "@/components/products/product-catalog";

export default function ProductsPage() {
  return (
    <section className="pt-8 pb-16 px-5 md:px-8 bg-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-9">
          <div className="text-teal font-semibold text-sm tracking-widest">
            OUR FULL CATALOG
          </div>
          <h1 className="heading-font text-4xl md:text-5xl tracking-tighter font-semibold mt-1">
            Exactly what your project needs.
            <br />
            No compromises.
          </h1>
          <p className="text-slate-600 mt-3 max-w-2xl">
            Every category below is produced in our Memphis facility with the same
            75-year standard of precision. Click any card for fast AI guidance or
            to speak with a specialist.
          </p>
        </div>

        <ProductCatalog />

        <div className="mt-8 text-center">
          <Link
            href="/ai-tools"
            className="inline-flex px-8 py-3 font-semibold border-2 border-navy rounded-2xl text-sm hover:bg-slate-50"
          >
            Not sure what you need? Ask our AI right now →
          </Link>
        </div>
      </div>
    </section>
  );
}
