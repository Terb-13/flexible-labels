"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="pt-8 pb-16 px-5 md:px-8 bg-slate-50">
      <div className="max-w-screen-xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <div className="text-teal font-semibold tracking-wider text-sm">
              LET&apos;S GET STARTED
            </div>
            <h1 className="heading-font text-4xl font-semibold tracking-tighter mt-1">
              Quote it here, or call
            </h1>
            <p className="text-slate-600 mt-2">
              Self-serve quote is the new door. The published number on
              summitgraphics.org is 940-301-3585.
            </p>

            {submitted ? (
              <div className="mt-7 border border-emerald-200 bg-emerald-50 text-emerald-800 p-6 rounded-3xl">
                <div className="font-semibold text-lg">Request received (demo).</div>
                <div className="mt-2 text-sm">
                  This form does not send mail. Use Get a quote to save an
                  EXAMPLE estimate.
                </div>
                <div className="mt-4 flex gap-3">
                  <Button asChild className="bg-emerald-800 hover:bg-emerald-900">
                    <Link href="/quote">Get a quote</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>YOUR NAME</Label>
                    <Input required placeholder="Your name" className="mt-1" />
                  </div>
                  <div>
                    <Label>COMPANY</Label>
                    <Input required placeholder="Company name" className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>EMAIL</Label>
                    <Input
                      type="email"
                      required
                      placeholder="you@company.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>PHONE</Label>
                    <Input type="tel" placeholder="Phone number" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>PROJECT DETAILS</Label>
                  <Textarea
                    required
                    rows={4}
                    placeholder="Product, size, quantity, and any timing"
                    className="mt-1"
                  />
                </div>
                <Button type="submit" variant="cta" className="w-full h-12">
                  Send a note
                </Button>
              </form>
            )}
          </div>

          <div className="lg:pt-10">
            <div className="text-sm px-1">
              <div className="font-semibold mb-1">Prefer self-serve?</div>
              <ul className="space-y-2 text-slate-600">
                <li className="flex gap-x-2">
                  <span className="text-teal mt-1">→</span>
                  <Link href="/quote" className="underline">
                    Get a quote
                  </Link>
                  {" "}on the customer door
                </li>
                <li className="flex gap-x-2">
                  <span className="text-teal mt-1">→</span> Sign in at /portal/login
                  — customers never see Operations
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
