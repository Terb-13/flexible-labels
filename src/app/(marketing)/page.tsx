import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Clock,
  Eye,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="pt-8 md:pt-10 pb-16">
      <div className="max-w-screen-xl mx-auto px-5 md:px-8">
        <div className="grid md:grid-cols-12 gap-8 md:gap-10 items-center">
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-x-2 bg-white shadow-sm border border-slate-200 rounded-full px-4 py-1 mb-6 text-sm">
              <div className="flex -space-x-1 items-center">
                <div className="w-2 h-2 bg-teal rounded-full" />
                <div className="w-2 h-2 bg-cta rounded-full" />
              </div>
              <span className="font-medium text-slate-700">
                Trusted by procurement & brand teams across North America
              </span>
            </div>

            <h1 className="heading-font text-5xl md:text-6xl tracking-tighter leading-[1.05] font-semibold text-navy">
              Stop chasing your label supplier.
              <br />
              Get control instead.
            </h1>
            <p className="mt-5 text-xl text-slate-600 max-w-[42ch]">
              75-year Memphis manufacturer with modern tools that give you speed,
              clarity, and the right material the first time.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Button asChild variant="cta" size="lg" className="rounded-2xl shadow-sm">
                <Link href="/quote">Get Instant Quote</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-2xl border-2 border-navy">
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>

            <div className="mt-6 flex items-center gap-x-5 text-sm">
              <div className="flex items-center text-slate-500">
                <Check className="text-teal mr-1.5 w-4 h-4" />
                <span>Real Memphis manufacturing</span>
              </div>
              <div className="text-slate-400 hidden sm:block">•</div>
              <div className="text-slate-500 text-sm">
                Lead time:{" "}
                <span className="font-semibold text-slate-700">
                  5–7 business days
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-900/5">
              <Image
                src="/images/hero.jpg"
                alt="High-quality custom roll labels produced by Flexible Label Group"
                width={800}
                height={500}
                className="w-full h-auto object-cover aspect-[16/10]"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-navy/30 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur px-4 py-2 rounded-2xl shadow flex items-center gap-x-3 text-sm">
                <div>
                  <div className="font-semibold text-sm tracking-tight">
                    Spring 2026 run
                  </div>
                  <div className="text-xs text-slate-600">
                    48,500 labels • On schedule
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-14 border-y border-slate-200 bg-white">
        <div className="max-w-screen-xl mx-auto px-5 md:px-8 py-5">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-x-8 gap-y-4 text-sm">
            <div className="flex items-center gap-x-2">
              <span className="font-semibold text-xl text-navy">75</span>
              <span className="text-slate-600">years in continuous production</span>
            </div>
            <div className="trust-pill px-4 py-1 rounded-full text-xs font-medium flex items-center gap-x-1.5 text-slate-700 border border-slate-100">
              <UserRound className="text-teal w-3.5 h-3.5" />
              <span>
                <strong>78%</strong> women-owned
              </span>
            </div>
            <div className="trust-pill px-4 py-1 rounded-full text-xs font-medium border border-slate-100">
              HUBZONE CERTIFIED
            </div>
            <div className="trust-pill px-4 py-1 rounded-full text-xs font-medium border border-slate-100">
              MADE IN MEMPHIS, TN
            </div>
            <div className="trust-pill px-4 py-1 rounded-full text-xs font-medium border border-slate-100">
              AI-ENABLED OPERATIONS
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-5 md:px-8 pt-14">
        <div className="text-center mb-8">
          <div className="uppercase tracking-[1.5px] text-xs font-semibold text-teal">
            WHAT THIS MEANS FOR YOU
          </div>
          <h2 className="heading-font text-3xl md:text-4xl tracking-tighter font-semibold mt-2">
            The old way wastes your time.
            <br />
            The better way gives it back.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: RefreshCw,
              title: "Right material. First time.",
              body: "No more guessing substrates. Our AI + real press experts recommend the exact construction that performs on your line and in your environment.",
              href: "/products",
              cta: "Explore all products →",
            },
            {
              icon: Clock,
              title: "No more email loops.",
              body: "Instant material guidance and quotes. Approve proofs in one click. Track real production status without calling anyone.",
              href: "/ai-tools",
              cta: "Try the AI assistant →",
            },
            {
              icon: Eye,
              title: "Full visibility. Real control.",
              body: "See exactly where every order is on the floor. Know your ship date. Approve or request changes instantly.",
              href: "/portal",
              cta: "Open live portal demo →",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="story-card bg-white border border-slate-200 p-7 rounded-3xl"
            >
              <div className="w-10 h-10 bg-teal/10 text-teal flex items-center justify-center rounded-2xl mb-5">
                <card.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-xl tracking-tight">{card.title}</h3>
              <p className="mt-3 text-slate-600">{card.body}</p>
              <Link
                href={card.href}
                className="mt-5 text-sm font-semibold text-cta flex items-center gap-x-1"
              >
                {card.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-5 md:px-8 pt-14">
        <div className="bg-navy text-white rounded-3xl px-8 py-10 md:py-12 md:px-12">
          <div className="max-w-xl">
            <div className="uppercase text-teal tracking-[1.5px] text-sm font-semibold mb-1">
              THE SIMPLE PLAN
            </div>
            <h3 className="text-3xl md:text-4xl tracking-tight font-semibold leading-tight">
              How we remove the friction from label buying.
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-7 mt-9">
            {[
              {
                step: "1",
                title: "Tell us what you need",
                body: "Use our AI or a specialist. Get an accurate quote and material recommendation in minutes.",
              },
              {
                step: "2",
                title: "Approve your proof online",
                body: "Review high-resolution proofs. Comment or approve directly. No PDF back-and-forth.",
              },
              {
                step: "3",
                title: "Track it to your dock",
                body: "Watch every stage in real time. Know the exact ship date before anyone asks.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full border border-white/30 flex items-center justify-center font-mono text-sm font-medium">
                  {item.step}
                </div>
                <div>
                  <div className="font-semibold text-lg">{item.title}</div>
                  <div className="text-white/70 text-[15px] mt-1">{item.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
