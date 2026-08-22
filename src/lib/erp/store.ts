import { randomUUID } from "crypto";
import {
  EXAMPLE_EQUIPMENT,
  EXAMPLE_COMPANIES,
} from "@/lib/data/example-catalog";
import {
  localGetQuote,
  localListCompanies,
  localListJobs,
  localListQuotes,
  localSaveJob,
  localSaveQuote,
  localUpsertCompany,
} from "@/lib/data/local-store";
import { loadCatalog, loadCompanies, mapCompany } from "@/lib/pricing/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type {
  Company,
  CompanyType,
  Equipment,
  JobStep,
  QuoteBreakdown,
  QuoteSpec,
  QuoteStatus,
  SavedQuote,
  ScheduleJob,
} from "@/types";

async function writer() {
  const admin = createAdminClient();
  if (admin) return admin;
  if (!isSupabaseConfigured()) return null;
  try {
    return await createClient();
  } catch {
    return null;
  }
}

function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function listCompanies(): Promise<Company[]> {
  if (!isSupabaseConfigured()) return localListCompanies();
  return loadCompanies();
}

export async function createCompany(input: {
  name: string;
  type: CompanyType;
  margin_percent: number;
  target_margin_percent: number;
  discount_percent: number;
}): Promise<Company> {
  const company: Company = {
    id: randomUUID(),
    name: input.name.trim(),
    is_reseller: input.type === "reseller",
    margin_percent: input.margin_percent,
    target_margin_percent: input.target_margin_percent,
    discount_percent: input.discount_percent,
  };

  const client = await writer();
  if (!client) return localUpsertCompany(company);

  const { data, error } = await client
    .from("companies")
    .insert({
      id: company.id,
      name: company.name,
      is_reseller: company.is_reseller,
      margin_percent: company.margin_percent,
      target_margin_percent: company.target_margin_percent,
      discount_percent: company.discount_percent,
    })
    .select(
      "id, name, margin_percent, is_reseller, target_margin_percent, discount_percent"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create company");
  }
  return mapCompany(data as Record<string, unknown>);
}

export async function listEquipment(): Promise<Equipment[]> {
  const catalog = await loadCatalog();
  return catalog.equipment.length ? catalog.equipment : EXAMPLE_EQUIPMENT;
}

export async function listQuotes(): Promise<SavedQuote[]> {
  const client = await writer();
  if (!client) return localListQuotes();

  const { data, error } = await client
    .from("quotes")
    .select("id, company_id, spec, breakdown, status, needs_approval, order_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return localListQuotes();
  return data as SavedQuote[];
}

export async function saveQuote(input: {
  companyId: string;
  spec: QuoteSpec;
  breakdown: QuoteBreakdown;
  createdBy?: string | null;
}): Promise<SavedQuote> {
  const status: QuoteStatus = input.breakdown.needsApproval
    ? "pending_approval"
    : "approved";
  const quote: SavedQuote = {
    id: randomUUID(),
    company_id: input.companyId,
    spec: input.spec,
    breakdown: input.breakdown,
    status,
    needs_approval: input.breakdown.needsApproval,
    order_id: null,
    created_at: new Date().toISOString(),
  };

  const client = await writer();
  if (!client) return localSaveQuote(quote);

  const { data, error } = await client
    .from("quotes")
    .insert({
      id: quote.id,
      company_id: quote.company_id,
      created_by: input.createdBy ?? null,
      spec: quote.spec,
      breakdown: quote.breakdown,
      status: quote.status,
      needs_approval: quote.needs_approval,
    })
    .select("id, company_id, spec, breakdown, status, needs_approval, order_id, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save quote");
  }
  return data as SavedQuote;
}

export async function approveQuote(quoteId: string): Promise<SavedQuote> {
  const client = await writer();
  if (!client) {
    const existing = localGetQuote(quoteId);
    if (!existing) throw new Error("Quote not found");
    return localSaveQuote({
      ...existing,
      status: "approved",
      needs_approval: false,
    });
  }

  const { data, error } = await client
    .from("quotes")
    .update({ status: "approved", needs_approval: false })
    .eq("id", quoteId)
    .select("id, company_id, spec, breakdown, status, needs_approval, order_id, created_at")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not approve quote");
  return data as SavedQuote;
}

function mapJobRow(
  row: Record<string, unknown>,
  steps: JobStep[]
): ScheduleJob {
  return {
    id: String(row.id),
    job_number: String(row.job_number),
    name: String(row.name),
    quantity: String(row.quantity),
    company_id: String(row.company_id ?? ""),
    material: String(row.material ?? ""),
    due_date: String(row.due_date ?? ""),
    quote_id: row.quote_id ? String(row.quote_id) : null,
    order_id: row.order_id ? String(row.order_id) : null,
    started_at: row.started_at ? String(row.started_at) : null,
    ended_at: row.ended_at ? String(row.ended_at) : null,
    status: (row.status as ScheduleJob["status"]) ?? "scheduled",
    steps,
    resource: row.resource ? String(row.resource) : null,
    start_day: row.start_day == null ? null : asNumber(row.start_day),
  };
}

export async function listJobs(): Promise<ScheduleJob[]> {
  const client = await writer();
  if (!client) return localListJobs();

  const { data: jobs, error } = await client
    .from("schedule_jobs")
    .select("*")
    .order("started_at", { ascending: true });

  if (error || !jobs) return localListJobs();

  const { data: steps } = await client
    .from("job_steps")
    .select("*, equipment:equipment_id (*)")
    .order("step_order");

  return jobs.map((job) =>
    mapJobRow(
      job as Record<string, unknown>,
      ((steps ?? []).filter((s) => s.job_id === job.id) as JobStep[]).map(
        (step) => ({
          ...step,
          planned_hours: asNumber(step.planned_hours),
        })
      )
    )
  );
}

function nextSlotStart(existing: ScheduleJob[]): Date {
  const now = new Date();
  const latest = existing.reduce((max, job) => {
    if (!job.ended_at) return max;
    const end = new Date(job.ended_at).getTime();
    return end > max ? end : max;
  }, now.getTime());
  return new Date(Math.max(now.getTime(), latest));
}

export async function createJobFromQuote(quoteId: string): Promise<ScheduleJob> {
  const client = await writer();
  const existingJobs = client ? await listJobs() : localListJobs();
  const catalog = await loadCatalog();

  let quote: SavedQuote | null = null;
  if (client) {
    const { data } = await client
      .from("quotes")
      .select("id, company_id, spec, breakdown, status, needs_approval, order_id, created_at")
      .eq("id", quoteId)
      .single();
    quote = (data as SavedQuote | null) ?? null;
  } else {
    quote = localGetQuote(quoteId) ?? null;
  }

  if (!quote) throw new Error("Quote not found");
  if (quote.status !== "approved") {
    throw new Error("Quote must be approved before a job ticket can be written");
  }

  const already = existingJobs.find((j) => j.quote_id === quoteId);
  if (already) return already;

  const spec = quote.spec;
  const breakdown = quote.breakdown;
  const started = nextSlotStart(existingJobs);
  let cursor = started.getTime();
  const steps: JobStep[] = breakdown.lines.map((line, index) => {
    const start = new Date(cursor);
    const hours = line.hours || 0.25;
    cursor += hours * 3600 * 1000;
    const end = new Date(cursor);
    const equipment =
      catalog.equipment.find((e) => e.id === line.equipmentId) ??
      EXAMPLE_EQUIPMENT.find((e) => e.stage === line.stage);
    return {
      id: randomUUID(),
      job_id: "",
      equipment_id: line.equipmentId || equipment?.id || "",
      route_step_id: null,
      planned_hours: hours,
      actual_hours: null,
      actual_waste: null,
      status: "pending",
      step_order: index + 1,
      equipment: equipment ?? undefined,
      started_at: start.toISOString(),
      ended_at: end.toISOString(),
    };
  });

  const ended = new Date(cursor);
  const jobId = randomUUID();
  steps.forEach((s) => {
    s.job_id = jobId;
  });

  const orderNumber = `FLG-${47000 + Math.floor(Math.random() * 999)}`;
  const jobNumber = `J-${3000 + Math.floor(Math.random() * 900)}`;
  const due = new Date(ended.getTime() + 2 * 24 * 3600 * 1000);

  if (client) {
    const { data: order, error: orderError } = await client
      .from("orders")
      .insert({
        order_number: orderNumber,
        company_id: quote.company_id,
        description: `${spec.product} ${spec.widthIn}x${spec.heightIn} ${spec.material}`,
        quantity: spec.quantity,
        status: "Scheduled",
        ship_by: due.toISOString().slice(0, 10),
        progress: 5,
        total_amount: breakdown.finalPrice,
        quote_id: quote.id,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message ?? "Could not write order");
    }

    await client
      .from("quotes")
      .update({ order_id: order.id })
      .eq("id", quote.id);

    const { data: job, error: jobError } = await client
      .from("schedule_jobs")
      .insert({
        id: jobId,
        job_number: jobNumber,
        company_id: quote.company_id,
        name: `${spec.product} — ${spec.material}`,
        quantity: String(spec.quantity),
        material: spec.material,
        due_date: due.toISOString().slice(0, 10),
        quote_id: quote.id,
        order_id: order.id,
        started_at: started.toISOString(),
        ended_at: ended.toISOString(),
        status: "scheduled",
      })
      .select("*")
      .single();

    if (jobError || !job) {
      throw new Error(jobError?.message ?? "Could not write job");
    }

    const { error: stepError } = await client.from("job_steps").insert(
      steps.map((step) => ({
        id: step.id,
        job_id: jobId,
        equipment_id: step.equipment_id,
        route_step_id: step.route_step_id,
        planned_hours: step.planned_hours,
        status: step.status,
        step_order: step.step_order,
      }))
    );

    if (stepError) throw new Error(stepError.message);
    return mapJobRow(job as Record<string, unknown>, steps);
  }

  const job: ScheduleJob = {
    id: jobId,
    job_number: jobNumber,
    name: `${spec.product} — ${spec.material}`,
    quantity: String(spec.quantity),
    company_id: quote.company_id,
    material: spec.material,
    due_date: due.toISOString().slice(0, 10),
    quote_id: quote.id,
    order_id: null,
    started_at: started.toISOString(),
    ended_at: ended.toISOString(),
    status: "scheduled",
    steps,
  };
  return localSaveJob(job);
}

export async function rescheduleJob(
  jobId: string,
  startedAt: string
): Promise<ScheduleJob> {
  const client = await writer();
  const jobs = client ? await listJobs() : localListJobs();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) throw new Error("Job not found");

  let cursor = new Date(startedAt).getTime();
  const steps = job.steps.map((step) => {
    const start = new Date(cursor);
    cursor += (step.planned_hours || 0.25) * 3600 * 1000;
    return {
      ...step,
      started_at: start.toISOString(),
      ended_at: new Date(cursor).toISOString(),
    };
  });
  const updated: ScheduleJob = {
    ...job,
    started_at: startedAt,
    ended_at: new Date(cursor).toISOString(),
    steps,
  };

  if (!client) return localSaveJob(updated);

  const { error } = await client
    .from("schedule_jobs")
    .update({
      started_at: updated.started_at,
      ended_at: updated.ended_at,
    })
    .eq("id", jobId);

  if (error) throw new Error(error.message);
  return updated;
}

export function companyType(company: Company): CompanyType {
  return company.is_reseller ? "reseller" : "dtc";
}

export { EXAMPLE_COMPANIES };
