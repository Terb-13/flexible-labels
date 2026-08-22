import { randomUUID } from "crypto";
import {
  EXAMPLE_EQUIPMENT,
  EXAMPLE_COMPANIES,
} from "@/lib/data/example-catalog";
import {
  EXAMPLE_DELAY_REASONS,
  EXAMPLE_PLANT_SHIFTS,
} from "@/lib/data/example-floor";
import {
  localClockIn,
  localClockOut,
  localGetQuote,
  localListClocks,
  localListCompanies,
  localListJobs,
  localListQuotes,
  localSaveJob,
  localSaveQuote,
  localUpsertCompany,
} from "@/lib/data/local-store";
import { assertCanClockIn, ClockError, clockHours } from "@/lib/erp/clocks";
import { scheduleJobSteps, snapToShift } from "@/lib/erp/shifts";
import { loadCatalog, loadCompanies, loadCompany, mapCompany } from "@/lib/pricing/catalog";
import { calculateQuote, withAutoAcross } from "@/lib/pricing/engine";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type {
  ClockActivity,
  Company,
  CompanyType,
  DelayReason,
  Equipment,
  JobStep,
  PlantShift,
  QuoteBreakdown,
  QuoteSpec,
  QuoteStatus,
  SavedQuote,
  ScheduleJob,
  ShopFloorClock,
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

function newQuoteNumber(): string {
  return `Q-${10000 + Math.floor(Math.random() * 90000)}`;
}

function hydrateQuote(row: SavedQuote): SavedQuote {
  const quote_number =
    row.quote_number ||
    row.spec?.quoteNumber ||
    `Q-${row.id.replace(/-/g, "").slice(0, 5).toUpperCase()}`;
  const qty_breaks =
    row.qty_breaks?.length ? row.qty_breaks : row.spec?.qtyBreaks ?? [];
  const grouped = row.grouped ?? Boolean(row.spec?.grouped);
  return {
    ...row,
    quote_number,
    qty_breaks,
    grouped,
    spec: { ...row.spec, quoteNumber: quote_number, qtyBreaks: qty_breaks, grouped },
  };
}

export async function listQuotes(): Promise<SavedQuote[]> {
  const client = await writer();
  if (!client) return localListQuotes().map(hydrateQuote);

  let data: unknown[] | null = null;
  const { data: firstData, error: firstError } = await client
    .from("quotes")
    .select("id, company_id, spec, breakdown, status, needs_approval, order_id, created_at, qty_breaks, grouped")
    .order("created_at", { ascending: false })
    .limit(50);
  data = firstData;
  let error = firstError;

  if (error && /qty_breaks|grouped/.test(error.message ?? "")) {
    const retry = await client
      .from("quotes")
      .select("id, company_id, spec, breakdown, status, needs_approval, order_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) return localListQuotes().map(hydrateQuote);
  return (data as SavedQuote[]).map(hydrateQuote);
}

export async function listQuotesForCompany(companyId: string): Promise<SavedQuote[]> {
  const all = await listQuotes();
  return all.filter((q) => q.company_id === companyId);
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
  const quote_number = input.spec.quoteNumber || newQuoteNumber();
  const spec: QuoteSpec = { ...input.spec, quoteNumber: quote_number };
  const qty_breaks = spec.qtyBreaks?.filter((n) => Number(n) > 0).slice(0, 7) ?? [];
  const grouped = Boolean(spec.grouped);
  const quote: SavedQuote = {
    id: randomUUID(),
    company_id: input.companyId,
    spec: { ...spec, qtyBreaks: qty_breaks, grouped },
    breakdown: input.breakdown,
    status,
    needs_approval: input.breakdown.needsApproval,
    order_id: null,
    created_at: new Date().toISOString(),
    quote_number,
    qty_breaks,
    grouped,
  };

  const client = await writer();
  if (!client) return localSaveQuote(quote);

  const base = {
    id: quote.id,
    company_id: quote.company_id,
    created_by: input.createdBy ?? null,
    spec: quote.spec,
    breakdown: quote.breakdown,
    status: quote.status,
    needs_approval: quote.needs_approval,
  };

  let data: unknown = null;
  const { data: firstRow, error: firstInsertError } = await client
    .from("quotes")
    .insert({
      ...base,
      qty_breaks: quote.qty_breaks ?? [],
      grouped: quote.grouped ?? false,
    })
    .select("id, company_id, spec, breakdown, status, needs_approval, order_id, created_at, qty_breaks, grouped")
    .single();
  data = firstRow;
  let error = firstInsertError;

  if (error && /qty_breaks|grouped/.test(error.message ?? "")) {
    const retry = await client
      .from("quotes")
      .insert(base)
      .select("id, company_id, spec, breakdown, status, needs_approval, order_id, created_at")
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save quote");
  }
  return hydrateQuote(data as SavedQuote);
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
    .select("id, company_id, spec, breakdown, status, needs_approval, order_id, created_at, qty_breaks, grouped")
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
    repeat_in: row.repeat_in == null ? null : asNumber(row.repeat_in),
    across: row.across == null ? null : asNumber(row.across),
    production_feet:
      row.production_feet == null ? null : asNumber(row.production_feet),
    resource: row.resource ? String(row.resource) : null,
    start_day: row.start_day == null ? null : asNumber(row.start_day),
  };
}

function mapStep(row: Record<string, unknown>): JobStep {
  return {
    id: String(row.id),
    job_id: String(row.job_id),
    equipment_id: String(row.equipment_id),
    route_step_id: row.route_step_id ? String(row.route_step_id) : null,
    planned_hours: asNumber(row.planned_hours),
    actual_hours: row.actual_hours == null ? null : asNumber(row.actual_hours),
    actual_waste: row.actual_waste == null ? null : asNumber(row.actual_waste),
    status: (row.status as JobStep["status"]) ?? "pending",
    step_order: asNumber(row.step_order),
    equipment: row.equipment
      ? (row.equipment as JobStep["equipment"])
      : undefined,
    started_at: row.started_at ? String(row.started_at) : undefined,
    ended_at: row.ended_at ? String(row.ended_at) : undefined,
    production_feet:
      row.production_feet == null ? null : asNumber(row.production_feet),
    repeat_in: row.repeat_in == null ? null : asNumber(row.repeat_in),
    across: row.across == null ? null : asNumber(row.across),
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
      ((steps ?? []) as Record<string, unknown>[])
        .filter((s) => s.job_id === job.id)
        .map(mapStep)
    )
  );
}

export async function listPlantShifts(): Promise<PlantShift[]> {
  const client = await writer();
  if (!client) return EXAMPLE_PLANT_SHIFTS;
  const { data, error } = await client
    .from("plant_shifts")
    .select("id, weekday, start_time, end_time, notes")
    .order("weekday");
  if (error || !data?.length) return EXAMPLE_PLANT_SHIFTS;
  return data.map((row) => ({
    id: String(row.id),
    weekday: asNumber(row.weekday),
    start_time: String(row.start_time).slice(0, 5),
    end_time: String(row.end_time).slice(0, 5),
    notes: row.notes ? String(row.notes) : undefined,
  }));
}

export async function listDelayReasons(): Promise<DelayReason[]> {
  const client = await writer();
  if (!client) return EXAMPLE_DELAY_REASONS;
  const { data, error } = await client
    .from("delay_reasons")
    .select("id, code, name, category")
    .order("code");
  if (error || !data?.length) return EXAMPLE_DELAY_REASONS;
  return data.map((row) => ({
    id: String(row.id),
    code: String(row.code),
    name: String(row.name),
    category: row.category as DelayReason["category"],
  }));
}

function mapClock(row: Record<string, unknown>): ShopFloorClock {
  const reason = row.delay_reasons as Record<string, unknown> | null;
  return {
    id: String(row.id),
    job_step_id: String(row.job_step_id),
    equipment_id: String(row.equipment_id),
    operator_id: row.operator_id ? String(row.operator_id) : null,
    activity: row.activity as ShopFloorClock["activity"],
    started_at: String(row.started_at),
    ended_at: row.ended_at ? String(row.ended_at) : null,
    delay_reason_id: row.delay_reason_id ? String(row.delay_reason_id) : null,
    notes: row.notes ? String(row.notes) : null,
    qty_good: row.qty_good == null ? null : asNumber(row.qty_good),
    qty_waste: row.qty_waste == null ? null : asNumber(row.qty_waste),
    delay_reason: reason
      ? {
          id: String(reason.id ?? row.delay_reason_id),
          code: String(reason.code ?? ""),
          name: String(reason.name ?? ""),
          category: reason.category as DelayReason["category"],
        }
      : undefined,
  };
}

export async function listClocks(): Promise<ShopFloorClock[]> {
  const client = await writer();
  if (!client) return localListClocks();
  const { data, error } = await client
    .from("shop_floor_clocks")
    .select("*, delay_reasons(*)")
    .order("started_at", { ascending: false })
    .limit(200);
  if (error || !data) return localListClocks();
  return (data as Record<string, unknown>[]).map(mapClock);
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

  const company = (await loadCompany(quote.company_id)) ?? EXAMPLE_COMPANIES[0];
  const spec = withAutoAcross(quote.spec, company, catalog);
  if (!(spec.across > 0) || !(spec.repeatIn > 0)) {
    throw new Error("Repeat (in) and across are required before writing a press job");
  }
  const breakdown = calculateQuote(spec, company, catalog);

  const shifts = await listPlantShifts();
  const draftSteps: JobStep[] = breakdown.lines.map((line, index) => {
    const equipment =
      catalog.equipment.find((e) => e.id === line.equipmentId) ??
      EXAMPLE_EQUIPMENT.find((e) => e.stage === line.stage);
    const isPress = line.stage === "printer";
    return {
      id: randomUUID(),
      job_id: "",
      equipment_id: line.equipmentId || equipment?.id || "",
      route_step_id: null,
      planned_hours: line.hours || 0.25,
      actual_hours: null,
      actual_waste: null,
      status: "pending",
      step_order: index + 1,
      equipment: equipment ?? undefined,
      production_feet: isPress ? (line.productionFeet ?? breakdown.productionFeet) : null,
      repeat_in: isPress ? spec.repeatIn : null,
      across: isPress ? spec.across : null,
    };
  });

  const placed = scheduleJobSteps({
    steps: draftSteps,
    from: snapToShift(new Date(), shifts),
    jobs: existingJobs,
    shifts,
  });
  const steps = placed.steps;
  const started = new Date(placed.startedAt);
  const ended = new Date(placed.endedAt);
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
        repeat_in: spec.repeatIn,
        across: spec.across,
        production_feet: breakdown.productionFeet,
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
        production_feet: step.production_feet,
        repeat_in: step.repeat_in,
        across: step.across,
        started_at: step.started_at,
        ended_at: step.ended_at,
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
    repeat_in: spec.repeatIn,
    across: spec.across,
    production_feet: breakdown.productionFeet,
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

  const shifts = await listPlantShifts();
  const allJobs = jobs;
  const origin = new Date(startedAt);
  const from = snapToShift(
    new Date(origin.getFullYear(), origin.getMonth(), origin.getDate()),
    shifts
  );
  const placed = scheduleJobSteps({
    steps: job.steps,
    from,
    jobs: allJobs,
    shifts,
    excludeJobId: jobId,
  });
  const updated: ScheduleJob = {
    ...job,
    started_at: placed.startedAt,
    ended_at: placed.endedAt,
    steps: placed.steps,
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

  for (const step of placed.steps) {
    const { error: stepError } = await client
      .from("job_steps")
      .update({
        started_at: step.started_at,
        ended_at: step.ended_at,
      })
      .eq("id", step.id);
    if (stepError) throw new Error(stepError.message);
  }
  return updated;
}

export async function clockIn(input: {
  jobStepId: string;
  equipmentId: string;
  operatorId: string | null;
  activity: ClockActivity;
  delayReasonId?: string | null;
  notes?: string | null;
}): Promise<ShopFloorClock> {
  const clocks = await listClocks();
  assertCanClockIn({
    clocks,
    equipmentId: input.equipmentId,
    activity: input.activity,
    delayReasonId: input.delayReasonId,
  });

  const clock: ShopFloorClock = {
    id: randomUUID(),
    job_step_id: input.jobStepId,
    equipment_id: input.equipmentId,
    operator_id: input.operatorId,
    activity: input.activity,
    started_at: new Date().toISOString(),
    ended_at: null,
    delay_reason_id: input.delayReasonId ?? null,
    notes: input.notes ?? null,
    qty_good: null,
    qty_waste: null,
  };

  const client = await writer();
  if (!client) return localClockIn(clock);

  const { data, error } = await client
    .from("shop_floor_clocks")
    .insert({
      id: clock.id,
      job_step_id: clock.job_step_id,
      equipment_id: clock.equipment_id,
      operator_id: clock.operator_id,
      activity: clock.activity,
      started_at: clock.started_at,
      delay_reason_id: clock.delay_reason_id,
      notes: clock.notes,
    })
    .select("*, delay_reasons(*)")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new ClockError("This press already has an open clock");
    }
    if (error?.code === "23514") {
      throw new ClockError("Delay requires a reason code");
    }
    throw new Error(error?.message ?? "Could not clock in");
  }

  if (input.activity === "setup" || input.activity === "run") {
    const jobs = await listJobs();
    const job = jobs.find((j) => j.steps.some((s) => s.id === input.jobStepId));
    if (job) {
      await client
        .from("job_steps")
        .update({ status: "running" })
        .eq("id", input.jobStepId);
      await client
        .from("schedule_jobs")
        .update({ status: "running" })
        .eq("id", job.id);
    }
  }

  return mapClock(data as Record<string, unknown>);
}

export async function clockOut(input: {
  clockId: string;
  qtyGood?: number | null;
  qtyWaste?: number | null;
  notes?: string | null;
}): Promise<ShopFloorClock> {
  const endedAt = new Date().toISOString();
  const client = await writer();

  if (!client) {
    return localClockOut({
      clockId: input.clockId,
      endedAt,
      qtyGood: input.qtyGood ?? null,
      qtyWaste: input.qtyWaste ?? null,
      notes: input.notes ?? null,
    });
  }

  const { data: existing, error: findError } = await client
    .from("shop_floor_clocks")
    .select("*, delay_reasons(*)")
    .eq("id", input.clockId)
    .single();

  if (findError || !existing) throw new Error("Clock not found");
  if (existing.ended_at) throw new Error("Clock is already closed");

  const { data, error } = await client
    .from("shop_floor_clocks")
    .update({
      ended_at: endedAt,
      qty_good: input.qtyGood ?? null,
      qty_waste: input.qtyWaste ?? null,
      notes: input.notes ?? existing.notes,
    })
    .eq("id", input.clockId)
    .select("*, delay_reasons(*)")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not clock out");

  const hours = clockHours(String(existing.started_at), endedAt);
  const { data: step } = await client
    .from("job_steps")
    .select("id, job_id, actual_hours, actual_waste")
    .eq("id", existing.job_step_id)
    .single();

  if (step) {
    await client
      .from("job_steps")
      .update({
        actual_hours: asNumber(step.actual_hours) + hours,
        actual_waste:
          input.qtyWaste == null
            ? step.actual_waste
            : asNumber(step.actual_waste) + asNumber(input.qtyWaste),
        status: "pending",
      })
      .eq("id", step.id);

    const { data: siblings } = await client
      .from("job_steps")
      .select("id")
      .eq("job_id", step.job_id);
    const stepIds = (siblings ?? []).map((s) => s.id);
    const { data: open } = stepIds.length
      ? await client
          .from("shop_floor_clocks")
          .select("id")
          .in("job_step_id", stepIds)
          .is("ended_at", null)
      : { data: [] };

    if (!open?.length) {
      await client
        .from("schedule_jobs")
        .update({ status: "scheduled" })
        .eq("id", step.job_id)
        .eq("status", "running");
    }
  }

  return mapClock(data as Record<string, unknown>);
}

export function companyType(company: Company): CompanyType {
  return company.is_reseller ? "reseller" : "dtc";
}

export { EXAMPLE_COMPANIES };
