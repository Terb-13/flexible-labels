"use client";

import { useSearchParams } from "next/navigation";
import { ChatWidget } from "@/components/chat/chat-widget";

export default function AiToolsPage() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt") ?? undefined;

  return (
    <section className="pt-8 pb-16 px-5 md:px-8 bg-slate-50">
      <div className="max-w-screen-xl mx-auto">
        <div className="max-w-2xl">
          <div className="uppercase text-teal tracking-widest text-sm font-semibold">
            PRACTICAL AI THAT WORKS
          </div>
          <h1 className="heading-font text-4xl md:text-5xl tracking-tighter font-semibold mt-1">
            Less email. Better decisions. Faster.
          </h1>
          <p className="text-lg text-slate-600 mt-3">
            Our AI assistant gives instant, realistic answers based on 75 years of
            actual production experience.
          </p>
        </div>

        <div className="mt-8">
          <ChatWidget initialMessage={prompt} />
        </div>
      </div>
    </section>
  );
}
