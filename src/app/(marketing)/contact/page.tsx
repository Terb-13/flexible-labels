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
              Tell us about your project
            </h1>
            <p className="text-slate-600 mt-2">
              A specialist will respond within 2 business hours. Or use the AI
              assistant instantly.
            </p>

            {submitted ? (
              <div className="mt-7 border border-emerald-200 bg-emerald-50 text-emerald-800 p-6 rounded-3xl">
                <div className="font-semibold text-lg">Thank you. Request received.</div>
                <div className="mt-2 text-sm">
                  A production specialist will contact you within 2 business hours.
                </div>
                <div className="mt-4 flex gap-3">
                  <Button asChild variant="outline">
                    <Link href="/ai-tools">Talk to AI now</Link>
                  </Button>
                  <Button asChild className="bg-emerald-800 hover:bg-emerald-900">
                    <Link href="/portal">Open Portal</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>YOUR NAME</Label>
                    <Input required defaultValue="Taylor Kim" className="mt-1" />
                  </div>
                  <div>
                    <Label>COMPANY</Label>
                    <Input required defaultValue="Acme Brands" className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>EMAIL</Label>
                    <Input
                      type="email"
                      required
                      defaultValue="taylor@acmebrands.co"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>PHONE</Label>
                    <Input type="tel" defaultValue="(615) 555-0174" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>PROJECT DETAILS</Label>
                  <Textarea
                    required
                    rows={4}
                    defaultValue='Need 18,000 matte BOPP roll labels for refrigerated beverage. 2.25" x 3.5". Need samples by March 18.'
                    className="mt-1"
                  />
                </div>
                <Button type="submit" variant="cta" className="w-full h-12">
                  Request Quote & Consultation
                </Button>
              </form>
            )}
          </div>

          <div className="lg:pt-10">
            <div className="border border-slate-200 bg-white p-7 rounded-3xl">
              <div className="font-semibold">Need answers faster?</div>
              <div className="text-sm mt-1 text-slate-600">
                Our AI assistant is trained on real production data.
              </div>
              <Button asChild className="mt-4 w-full h-11">
                <Link href="/ai-tools">Open AI Assistant Now</Link>
              </Button>
            </div>
            <div className="mt-4 text-sm px-1">
              <div className="font-semibold mb-1">Next steps</div>
              <ul className="space-y-2 text-slate-600">
                <li className="flex gap-x-2">
                  <span className="text-teal mt-1">→</span> Use the AI assistant to
                  explore material options
                </li>
                <li className="flex gap-x-2">
                  <span className="text-teal mt-1">→</span> Try the full Customer Portal
                </li>
                <li className="flex gap-x-2">
                  <span className="text-teal mt-1">→</span> Receive a formal quote
                  within hours
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
