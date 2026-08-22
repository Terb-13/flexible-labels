import { EXAMPLE_DELAY_REASONS } from "@/lib/data/example-floor";
import { clockHours } from "@/lib/erp/clocks";
import type { Company, SavedQuote, ScheduleJob, ShopFloorClock } from "@/types";
import { EXAMPLE_COMPANIES } from "@/lib/data/example-catalog";

/**
 * In-process preview store used only when Supabase is not configured.
 * Production writes go to companies / quotes / schedule_jobs / job_steps /
 * shop_floor_clocks.
 */
const companies: Company[] = EXAMPLE_COMPANIES.map((c) => ({ ...c }));
const quotes: SavedQuote[] = [];
const jobs: ScheduleJob[] = [];
const clocks: ShopFloorClock[] = [];

export function localListCompanies(): Company[] {
  return companies.map((c) => ({ ...c }));
}

export function localUpsertCompany(company: Company): Company {
  const idx = companies.findIndex((c) => c.id === company.id);
  if (idx >= 0) companies[idx] = company;
  else companies.push(company);
  return company;
}

export function localListQuotes(): SavedQuote[] {
  return quotes.map((q) => ({ ...q }));
}

export function localSaveQuote(quote: SavedQuote): SavedQuote {
  const idx = quotes.findIndex((q) => q.id === quote.id);
  if (idx >= 0) quotes[idx] = quote;
  else quotes.push(quote);
  return quote;
}

export function localGetQuote(id: string): SavedQuote | undefined {
  return quotes.find((q) => q.id === id);
}

export function localListJobs(): ScheduleJob[] {
  return jobs.map((j) => ({
    ...j,
    steps: j.steps.map((s) => ({ ...s })),
  }));
}

export function localSaveJob(job: ScheduleJob): ScheduleJob {
  const idx = jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) jobs[idx] = job;
  else jobs.push(job);
  return job;
}

export function localGetJob(id: string): ScheduleJob | undefined {
  return jobs.find((j) => j.id === id);
}

export function localListClocks(): ShopFloorClock[] {
  return clocks.map((c) => ({
    ...c,
    delay_reason:
      c.delay_reason ??
      EXAMPLE_DELAY_REASONS.find((r) => r.id === c.delay_reason_id),
  }));
}

function patchJobStep(
  jobStepId: string,
  patch: {
    status?: ScheduleJob["steps"][number]["status"];
    actual_hours?: number | null;
    actual_waste?: number | null;
  },
  jobStatus?: ScheduleJob["status"]
) {
  for (const job of jobs) {
    const step = job.steps.find((s) => s.id === jobStepId);
    if (!step) continue;
    if (patch.status) step.status = patch.status;
    if (patch.actual_hours != null) step.actual_hours = patch.actual_hours;
    if (patch.actual_waste != null) step.actual_waste = patch.actual_waste;
    if (jobStatus) job.status = jobStatus;
  }
}

export function localClockIn(clock: ShopFloorClock): ShopFloorClock {
  clocks.unshift(clock);
  if (clock.activity === "setup" || clock.activity === "run") {
    patchJobStep(clock.job_step_id, { status: "running" }, "running");
  }
  return {
    ...clock,
    delay_reason: EXAMPLE_DELAY_REASONS.find((r) => r.id === clock.delay_reason_id),
  };
}

export function localClockOut(input: {
  clockId: string;
  endedAt: string;
  qtyGood: number | null;
  qtyWaste: number | null;
  notes: string | null;
}): ShopFloorClock {
  const clock = clocks.find((c) => c.id === input.clockId);
  if (!clock) throw new Error("Clock not found");
  if (clock.ended_at) throw new Error("Clock is already closed");
  clock.ended_at = input.endedAt;
  clock.qty_good = input.qtyGood;
  clock.qty_waste = input.qtyWaste;
  if (input.notes != null) clock.notes = input.notes;

  const hours = clockHours(clock.started_at, clock.ended_at);
  for (const job of jobs) {
    const step = job.steps.find((s) => s.id === clock.job_step_id);
    if (!step) continue;
    step.actual_hours = (step.actual_hours ?? 0) + hours;
    if (input.qtyWaste != null) {
      step.actual_waste = (step.actual_waste ?? 0) + input.qtyWaste;
    }
    step.status = "pending";
    const stillOpen = clocks.some(
      (c) =>
        c.ended_at == null &&
        job.steps.some((s) => s.id === c.job_step_id)
    );
    if (!stillOpen && job.status === "running") job.status = "scheduled";
  }

  return {
    ...clock,
    delay_reason: EXAMPLE_DELAY_REASONS.find((r) => r.id === clock.delay_reason_id),
  };
}
