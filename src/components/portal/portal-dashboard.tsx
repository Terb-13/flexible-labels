"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DEMO_COMPANY,
  DEMO_HISTORY,
  DEMO_INVOICES,
  DEMO_ORDERS,
  DEMO_PROOF,
  DEMO_PROOF_COMMENTS,
  DEMO_SCHEDULE_JOBS,
  GANTT_DAYS,
  ORDER_TIMELINE_STAGES,
} from "@/lib/data/demo-data";
import { formatCurrency } from "@/lib/pricing/engine";
import type { Invoice, Order, ProofComment, ScheduleJob } from "@/types";
import type { Profile } from "@/types";
import { logoutDemo } from "@/app/portal/actions";
import { GanttScheduler } from "@/components/portal/gantt-scheduler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Check, Upload } from "lucide-react";

type Tab = "proofing" | "tracking" | "payments" | "history" | "estimator";

export function PortalDashboard({
  profile,
  isEmployee,
}: {
  profile: Profile;
  isEmployee: boolean;
}) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"customer" | "business">("customer");
  const [tab, setTab] = useState<Tab>("proofing");
  const [proofStatus, setProofStatus] = useState(DEMO_PROOF.status);
  const [proofImage, setProofImage] = useState(DEMO_PROOF.image_url);
  const [comments, setComments] = useState<ProofComment[]>(DEMO_PROOF_COMMENTS);
  const [commentInput, setCommentInput] = useState("");
  const [orders, setOrders] = useState(DEMO_ORDERS);
  const [invoices, setInvoices] = useState(DEMO_INVOICES);
  const [history] = useState(DEMO_HISTORY);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [jobs, setJobs] = useState<ScheduleJob[]>(DEMO_SCHEDULE_JOBS);
  const [payModal, setPayModal] = useState<Invoice | null>(null);

  const activeTabContent = useMemo(() => {
    if (viewMode === "business") return null;
    return tab;
  }, [viewMode, tab]);

  function addComment() {
    if (!commentInput.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        proof_id: DEMO_PROOF.id,
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
        proof_id: DEMO_PROOF.id,
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
        proof_id: DEMO_PROOF.id,
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
          proof_id: DEMO_PROOF.id,
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
            <div className="font-semibold">{DEMO_COMPANY.name}</div>
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
            <form action={logoutDemo}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>

        {isEmployee && (
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <div>
              <span className="text-xs font-semibold text-slate-500 mr-2">
                VIEW MODE
              </span>
              <div className="inline-flex rounded-2xl border p-0.5 bg-white text-sm">
                <button
                  type="button"
                  onClick={() => setViewMode("customer")}
                  className={cn(
                    "px-4 py-1 rounded-[14px] text-xs font-semibold",
                    viewMode === "customer"
                      ? "view-toggle-active"
                      : "text-slate-600"
                  )}
                >
                  Customer View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("business")}
                  className={cn(
                    "px-4 py-1 rounded-[14px] text-xs font-semibold",
                    viewMode === "business"
                      ? "view-toggle-active"
                      : "text-slate-600"
                  )}
                >
                  Business Operations
                </button>
              </div>
            </div>
            {viewMode === "customer" && (
              <div className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded-full hidden md:block">
                Customers only see simplified status. This is your internal tool.
              </div>
            )}
          </div>
        )}
      </div>

      {viewMode === "customer" && (
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
              href="/portal/estimator"
              className="px-5 py-3 text-sm font-semibold rounded-t-2xl border-b-2 border-transparent text-slate-600 hover:text-teal ml-auto"
            >
              New Quote / Estimator →
            </Link>
          </div>

          {activeTabContent === "proofing" && (
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="font-semibold">
                    Proof Review — {DEMO_PROOF.title}
                  </span>
                  <span className="text-sm ml-3 px-2.5 py-px bg-amber-100 text-amber-700 rounded">
                    3 of 4 approved
                  </span>
                </div>
                <div className="text-xs text-slate-500">Last updated today 9:41am</div>
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
                                {DEMO_PROOF.brand}
                              </div>
                              <div className="font-medium text-sm text-slate-600 -mt-0.5">
                                {DEMO_PROOF.product_name}
                              </div>
                            </div>
                            <div className="text-right text-[10px] font-mono text-emerald-600">
                              {DEMO_PROOF.proof_number}
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-slate-500">
                            {DEMO_PROOF.material}
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

          {activeTabContent === "tracking" && (
            <div className="p-6 md:p-8">
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

          {activeTabContent === "payments" && (
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

          {activeTabContent === "history" && (
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
      )}

      {viewMode === "business" && isEmployee && (
        <div className="p-6 md:p-8 border-t">
          <BusinessOpsPanel jobs={jobs} setJobs={setJobs} />
        </div>
      )}

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

      <div className="px-6 pb-4 text-xs text-slate-500">
        Fully interactive demo. Changes persist during your session.
      </div>
    </div>
  );
}

function BusinessOpsPanel({
  jobs,
  setJobs,
}: {
  jobs: ScheduleJob[];
  setJobs: React.Dispatch<React.SetStateAction<ScheduleJob[]>>;
}) {
  const { toast } = useToast();

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="font-semibold text-lg">Internal Manufacturing Operations</span>
            <span className="ml-3 px-2.5 py-px text-xs font-medium bg-amber-100 text-amber-700 rounded">
              FOR FLG TEAM ONLY
            </span>
          </div>
          <Button onClick={() => toast("Schedule re-optimized with AI.", true)}>
            Re-optimize with AI
          </Button>
        </div>
        <div className="text-xs text-amber-700 mb-4">
          Internal operations view. Customers only see simplified status and ship dates.
        </div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2">
          Acme Brands — Account Dashboard
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            ["YTD ORDER VOLUME", "$142,850", "+18% vs last year"],
            ["ON-TIME DELIVERY", "96%", "Above target (92%)"],
            ["OPEN INVOICES", "$2,780", "2 pending • 1 overdue"],
            ["ACTIVE ORDERS", "8", "5 in production"],
            ["AVG LEAD TIME", "6.2 days", "-0.8 days vs prior period"],
          ].map(([label, value, sub]) => (
            <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                {label}
              </div>
              <div className="text-2xl font-semibold text-navy mt-1">{value}</div>
              <div className="text-xs text-emerald-600 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      </div>
      <GanttScheduler jobs={jobs} days={GANTT_DAYS} onJobsChange={setJobs} />
      <div className="mt-4 flex gap-3">
        <Button asChild variant="outline">
          <Link href="/operations">Open full operations workspace →</Link>
        </Button>
      </div>
    </>
  );
}
