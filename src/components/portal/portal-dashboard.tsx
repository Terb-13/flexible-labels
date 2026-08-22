"use client";

import Link from "next/link";
import { useState } from "react";
import {
  DEMO_PROOF_COMMENTS,
  ORDER_TIMELINE_STAGES,
} from "@/lib/data/demo-data";
import { forCompany, quoteNumberOf } from "@/lib/data/tenant";
import { formatCurrency } from "@/lib/pricing/engine";
import type { Company, Invoice, Order, Proof, ProofComment, SavedQuote } from "@/types";
import type { Profile } from "@/types";
import { logoutPortal } from "@/app/portal/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Check, Upload } from "lucide-react";

type Tab = "proofing" | "tracking" | "payments" | "history";

export function PortalDashboard({
  profile,
  company,
  orders: initialOrders,
  history: initialHistory,
  invoices: initialInvoices,
  proof,
  quotes,
  highlightQuote,
}: {
  profile: Profile;
  company: Company | null;
  orders: Order[];
  history: Order[];
  invoices: Invoice[];
  proof: Proof | null;
  quotes: SavedQuote[];
  highlightQuote?: string | null;
}) {
  const companyId = profile.company_id;
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>(highlightQuote ? "tracking" : "proofing");
  const [proofStatus, setProofStatus] = useState(proof?.status ?? "No proof yet");
  const [proofImage, setProofImage] = useState(proof?.image_url ?? "");
  const [comments, setComments] = useState<ProofComment[]>(
    proof ? DEMO_PROOF_COMMENTS.filter((c) => c.proof_id === proof.id) : []
  );
  const [commentInput, setCommentInput] = useState("");
  const [orders, setOrders] = useState(() => forCompany(initialOrders, companyId));
  const [invoices, setInvoices] = useState(() => forCompany(initialInvoices, companyId));
  const [history] = useState(() => forCompany(initialHistory, companyId));
  const scopedQuotes = quotes.filter((q) => q.company_id === companyId);
  const highlighted = scopedQuotes.find(
    (q) => quoteNumberOf(q) === highlightQuote
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [payModal, setPayModal] = useState<Invoice | null>(null);

  function addComment() {
    if (!commentInput.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        proof_id: proof?.id ?? "",
        author: profile.full_name.split(" ")[0] + " T.",
        body: commentInput.trim(),
        created_at: "Just now",
      },
    ]);
    setCommentInput("");
    toast("Comment added.");
  }

  function approveProof() {
    setProofStatus("Approved");
    setComments((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        proof_id: proof?.id ?? "",
        author: profile.full_name.split(" ")[0] + " T.",
        body: "Proof approved. Thank you!",
        created_at: "Just now",
      },
    ]);
    toast("Proof approved. Moved to Prepress.", true);
  }

  function requestChanges() {
    const r = window.prompt("What changes are needed?");
    if (!r) return;
    setProofStatus("Changes Requested");
    setComments((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        proof_id: proof?.id ?? "",
        author: profile.full_name.split(" ")[0] + " T.",
        body: `Change requested: ${r}`,
        created_at: "Just now",
      },
    ]);
    toast("Change request submitted.");
  }

  function simulateUpload() {
    toast("Uploading artwork...");
    window.setTimeout(() => {
      setProofImage("/images/rolls.jpg");
      setComments((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          proof_id: proof?.id ?? "",
          author: profile.full_name.split(" ")[0] + " T.",
          body: "Uploaded revised artwork (v3).",
          created_at: "Just now",
        },
      ]);
      toast("Upload complete. Prepress notified.", true);
    }, 900);
  }

  function payInvoice(inv: Invoice) {
    setInvoices((prev) =>
      prev.map((i) => (i.id === inv.id ? { ...i, status: "Paid" as const } : i))
    );
    setPayModal(null);
    toast(`Payment successful — ${formatCurrency(inv.amount)} received`, true);
  }

  function reorder(order: Order) {
    const newShip = `Mar ${Math.floor(Math.random() * 6) + 16}`;
    const newOrder: Order = {
      ...order,
      id: `o-${Date.now()}`,
      order_number: `FLG-${47000 + Math.floor(Math.random() * 999)}`,
      status: "Reorder - Awaiting Proof",
      ship_by: newShip,
      progress: 5,
      total_amount: null,
      completed_at: null,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setTab("tracking");
    toast(`Reorder placed. New ship date: ${newShip}`, true);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="border-b px-6 py-4 bg-slate-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-y-3">
          <div>
            <div className="font-semibold">{company?.name ?? "Your account"}</div>
            <div className="text-xs text-emerald-600 flex items-center gap-x-1">
              <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full" />
              Active • {orders.length} open orders
            </div>
          </div>
          <div className="flex items-center gap-x-3">
            <div className="px-4 py-1 bg-white rounded-2xl text-xs border flex items-center gap-x-2">
              <span className="font-medium">{profile.full_name}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{profile.job_title}</span>
            </div>
            <form action={logoutPortal}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>

      </div>

      <>
          <div className="px-2 pt-2 border-b bg-white flex flex-wrap gap-x-1">
            {(
              [
                ["proofing", "Print Proofing"],
                ["tracking", "Order Tracking"],
                ["payments", "Account Payments"],
                ["history", "Order History"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "px-5 py-3 text-sm font-semibold rounded-t-2xl border-b-2",
                  tab === key
                    ? "border-teal text-navy"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                )}
              >
                {label}
              </button>
            ))}
            <Link
              href="/quote"
              className="px-5 py-3 text-sm font-semibold rounded-t-2xl border-b-2 border-transparent text-slate-600 hover:text-teal ml-auto"
            >
              Get Instant Quote →
            </Link>
          </div>

          {highlighted && (
            <div className="mx-6 mt-4 rounded-2xl border border-teal/30 bg-teal/5 px-4 py-3 text-sm">
              Quote <span className="font-mono font-semibold">{quoteNumberOf(highlighted)}</span>{" "}
              is on your account — {highlighted.spec.product} · {highlighted.spec.material} ·{" "}
              {highlighted.spec.quantity.toLocaleString()} qty.
            </div>
          )}

          {tab === "proofing" && !proof && (
            <div className="p-6 md:p-8 text-sm text-slate-600">
              No proofs are waiting for this account.
            </div>
          )}

          {tab === "proofing" && proof && (
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="font-semibold">
                    Proof Review — {proof.title}
                  </span>
                </div>
                <div className="text-xs text-slate-500">Your account only</div>
              </div>
              <div className="grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  <div className="text-xs font-semibold text-slate-500 mb-2">
                    CURRENT PROOF
                  </div>
                  <div className="label-preview border border-slate-200 rounded-2xl p-3">
                    <div
                      className="rounded-xl overflow-hidden bg-white p-5 shadow-inner relative min-h-[260px]"
                      style={{
                        backgroundImage: `url('${proofImage}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div className="max-w-[270px]">
                        <div className="bg-white/90 backdrop-blur-sm px-5 py-4 rounded-2xl border border-white/60">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold tracking-tighter text-3xl text-navy">
                                {proof.brand}
                              </div>
                              <div className="font-medium text-sm text-slate-600 -mt-0.5">
                                {proof.product_name}
                              </div>
                            </div>
                            <div className="text-right text-[10px] font-mono text-emerald-600">
                              {proof.proof_number}
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-slate-500">
                            {proof.material}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <Button variant="outline" className="flex-1 text-xs h-10" onClick={simulateUpload}>
                      <Upload className="w-3.5 h-3.5" /> Upload New Artwork
                    </Button>
                    <Button variant="secondary" className="flex-1 text-xs h-10 bg-amber-100 hover:bg-amber-200 text-amber-800" onClick={requestChanges}>
                      Request Changes
                    </Button>
                    <Button variant="teal" className="flex-1 text-xs h-10" onClick={approveProof}>
                      Approve
                    </Button>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="text-xs font-semibold text-slate-500 mb-2">
                    COMMENTS & HISTORY
                  </div>
                  <div className="border bg-white rounded-2xl h-[220px] flex flex-col">
                    <div className="flex-1 p-3 space-y-3 overflow-y-auto text-sm">
                      {comments.map((c) => (
                        <div key={c.id} className="text-sm px-2 py-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium">{c.author}</span>
                            <span className="text-slate-400">{c.created_at}</span>
                          </div>
                          <div className="text-slate-700">{c.body}</div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t p-2 flex gap-2 bg-slate-50">
                      <Input
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Add a comment..."
                        className="h-9 text-sm"
                      />
                      <Button size="sm" onClick={addComment}>
                        Post
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 text-xs font-medium text-slate-500">
                    Status:{" "}
                    <span
                      className={cn(
                        "font-semibold",
                        proofStatus === "Approved"
                          ? "text-emerald-600"
                          : proofStatus.includes("Changes")
                            ? "text-amber-700"
                            : "text-amber-600"
                      )}
                    >
                      {proofStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "tracking" && (
            <div className="p-6 md:p-8">
              {scopedQuotes.length > 0 && (
                <div className="mb-6">
                  <div className="text-xs font-semibold mb-2 tracking-wider text-slate-500">
                    YOUR QUOTES
                  </div>
                  <ul className="space-y-2 text-sm">
                    {scopedQuotes.map((q) => (
                      <li
                        key={q.id}
                        className={cn(
                          "border rounded-2xl px-4 py-3",
                          highlightQuote === quoteNumberOf(q) && "border-teal bg-teal/5"
                        )}
                      >
                        <span className="font-mono font-semibold">{quoteNumberOf(q)}</span>
                        <span className="text-slate-600">
                          {" "}
                          · {q.spec.product} · {q.spec.quantity.toLocaleString()} ·{" "}
                          {q.spec.material}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="text-xs font-semibold mb-2 tracking-wider text-slate-500">
                YOUR ACTIVE & RECENT ORDERS
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-semibold text-slate-500">
                      <th className="py-2 pr-4">ORDER</th>
                      <th className="py-2 pr-4">DESCRIPTION</th>
                      <th className="py-2 pr-4">QTY</th>
                      <th className="py-2 pr-4">STATUS</th>
                      <th className="py-2 pr-4">SHIP BY</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orders.map((o) => (
                      <tr
                        key={o.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => setSelectedOrder(o)}
                      >
                        <td className="py-3 pr-4 font-medium font-mono text-xs">
                          {o.order_number}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{o.description}</td>
                        <td className="py-3 pr-4">{o.quantity.toLocaleString()}</td>
                        <td className="py-3 pr-4">
                          <span className="status-pill bg-amber-100 text-amber-700">
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-500">{o.ship_by}</td>
                        <td className="py-3 text-right">
                          <Button variant="outline" size="sm">
                            View timeline
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedOrder && (
                <div className="mt-6 border rounded-3xl bg-slate-50 p-6">
                  <div className="flex justify-between mb-3">
                    <div className="font-semibold">
                      {selectedOrder.order_number} — {selectedOrder.description}
                    </div>
                    <button
                      type="button"
                      className="text-xs text-slate-400"
                      onClick={() => setSelectedOrder(null)}
                    >
                      CLOSE
                    </button>
                  </div>
                  <div className="mb-2">
                    <div className="h-2 bg-white rounded w-full overflow-hidden">
                      <div
                        className="h-2 bg-teal transition-all"
                        style={{ width: `${selectedOrder.progress}%` }}
                      />
                    </div>
                  </div>
                  <ul className="space-y-3 mt-4 text-sm">
                    {ORDER_TIMELINE_STAGES.map((stage, idx) => {
                      const threshold = [0, 15, 30, 35, 55, 75, 98][idx] ?? 0;
                      const done = selectedOrder.progress >= threshold;
                      return (
                        <li key={stage} className={cn("flex items-start gap-x-3", !done && "opacity-60")}>
                          <div
                            className={cn(
                              "w-[22px] h-[22px] rounded-full flex items-center justify-center text-xs",
                              done ? "bg-teal text-white" : "border border-slate-300 bg-white"
                            )}
                          >
                            {done && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <div className="font-medium">{stage}</div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          {tab === "payments" && (
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-semibold">Open & Recent Invoices</div>
                <div className="text-xs px-3 py-1 bg-white border rounded-full">
                  Net 30
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs font-semibold text-slate-500 text-left">
                      <th className="py-2">INVOICE</th>
                      <th className="py-2">DATE</th>
                      <th className="py-2">AMOUNT</th>
                      <th className="py-2">DUE</th>
                      <th className="py-2">STATUS</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-3 font-mono text-xs pr-3">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3 text-xs text-slate-500 pr-3">{inv.issued_at}</td>
                        <td className="py-3 font-medium">{formatCurrency(inv.amount)}</td>
                        <td className="py-3 text-xs">{inv.due_at}</td>
                        <td className="py-3">
                          <span
                            className={cn(
                              "status-pill",
                              inv.status === "Paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : inv.status === "Overdue"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            )}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {inv.status !== "Paid" ? (
                            <Button
                              variant="cta"
                              size="sm"
                              onClick={() => setPayModal(inv)}
                            >
                              Pay Now
                            </Button>
                          ) : (
                            <span className="text-emerald-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "history" && (
            <div className="p-6 md:p-8">
              <div className="text-xs font-semibold mb-3 tracking-wider text-slate-500">
                COMPLETED ORDERS — LAST 12 MONTHS
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs font-semibold text-slate-500 text-left">
                      <th className="py-2 pr-3">ORDER</th>
                      <th className="py-2 pr-3">DESCRIPTION</th>
                      <th className="py-2 pr-3">QTY</th>
                      <th className="py-2 pr-3">COMPLETED</th>
                      <th className="py-2 pr-3">TOTAL</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {history.map((h) => (
                      <tr key={h.id}>
                        <td className="py-3 pr-3 font-mono text-xs">{h.order_number}</td>
                        <td className="py-3 pr-3">{h.description}</td>
                        <td className="py-3 pr-3">{h.quantity.toLocaleString()}</td>
                        <td className="py-3 pr-3 text-xs text-slate-500">{h.ship_by}</td>
                        <td className="py-3 pr-3 font-medium">
                          {formatCurrency(h.total_amount ?? 0)}
                        </td>
                        <td className="py-3 text-right">
                          <Button variant="teal" size="sm" onClick={() => reorder(h)}>
                            Reorder
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>

      {payModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl px-7 pt-6 pb-7">
            <div className="font-semibold text-xl">Pay Invoice {payModal.invoice_number}</div>
            <div className="mt-0.5 text-sm text-slate-600">
              Amount due:{" "}
              <span className="font-semibold text-lg">
                {formatCurrency(payModal.amount)}
              </span>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div>
                <div className="text-xs text-slate-500">CARD NUMBER</div>
                <div className="border rounded-2xl px-4 py-2 mt-1 font-mono">
                  4242 4242 4242 4242
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setPayModal(null)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => payInvoice(payModal)}>
                Pay {formatCurrency(payModal.amount)}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
