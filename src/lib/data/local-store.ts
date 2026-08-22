import type { Company, SavedQuote, ScheduleJob } from "@/types";
import { EXAMPLE_COMPANIES } from "@/lib/data/example-catalog";

/**
 * In-process preview store used only when Supabase is not configured.
 * Production writes go to companies / quotes / schedule_jobs / job_steps.
 */
const companies: Company[] = EXAMPLE_COMPANIES.map((c) => ({ ...c }));
const quotes: SavedQuote[] = [];
const jobs: ScheduleJob[] = [];

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
