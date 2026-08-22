"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChatModal } from "@/components/chat/chat-modal";
import { EstimatorWorkspace } from "@/components/portal/estimator-workspace";
import { Button } from "@/components/ui/button";
import type { Company, Material } from "@/types";

export default function QuotePageClient({
  materials,
  materialNamesByProduct,
  companies,
  lockedCompany,
  loggedIn,
}: {
  materials: Material[];
  materialNamesByProduct?: Record<string, string[]>;
  companies: Company[];
  lockedCompany: Company | null;
  loggedIn: boolean;
}) {
  const searchParams = useSearchParams();
  const product = searchParams.get("product");
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <section className="pt-8 pb-20 px-5 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-8 max-w-2xl">
          <div className="text-teal font-semibold text-sm tracking-widest">
            ONLINE QUOTING
          </div>
          <h1 className="heading-font text-4xl md:text-5xl tracking-tighter font-semibold mt-1">
            Tell us what you need. We’ll price it.
          </h1>
          <p className="text-slate-600 mt-3">
            {lockedCompany
              ? "You’ll see an estimated sell price. Type and discount come from your account, not this form."
              : "Walk product, material, size, colors, and quantity. You’ll see an estimated sell price — we’ll confirm after review."}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => setChatOpen(true)}
          >
            Ask AI
          </Button>
        </div>
        <EstimatorWorkspace
          enableCheckout
          initialProductSlug={product}
          materials={materials}
          materialNamesByProduct={materialNamesByProduct}
          companies={companies}
          lockedCompany={lockedCompany}
          loggedIn={loggedIn}
          mode="public"
          allowChangeCustomer={false}
        />
        <ChatModal open={chatOpen} onOpenChange={setChatOpen} />
      </div>
    </section>
  );
}
