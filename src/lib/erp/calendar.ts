import type { Equipment, JobStep, ScheduleJob } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function withStepWindows(job: ScheduleJob): ScheduleJob {
  if (job.steps.some((s) => s.started_at && s.ended_at)) return job;
  let cursor = job.started_at ? new Date(job.started_at).getTime() : Date.now();
  const steps = job.steps.map((step) => {
    const start = new Date(cursor);
    cursor += Math.max(step.planned_hours || 0.25, 0.25) * 3600 * 1000;
    return {
      ...step,
      started_at: start.toISOString(),
      ended_at: new Date(cursor).toISOString(),
    };
  });
  return {
    ...job,
    started_at: job.started_at ?? steps[0]?.started_at ?? null,
    ended_at: job.ended_at ?? steps[steps.length - 1]?.ended_at ?? null,
    steps,
  };
}

export function calendarDays(jobs: ScheduleJob[], count = 14): Date[] {
  const dated = jobs.map(withStepWindows);
  const starts = dated
    .map((j) => (j.started_at ? new Date(j.started_at).getTime() : null))
    .filter((n): n is number => n != null);
  const origin = startOfDay(new Date(starts.length ? Math.min(...starts) : Date.now()));
  return Array.from({ length: count }, (_, i) => addDays(origin, i));
}

export function stepSpan(
  step: JobStep,
  days: Date[]
): { startIndex: number; span: number } | null {
  if (!step.started_at || !step.ended_at || days.length === 0) return null;
  const start = new Date(step.started_at).getTime();
  const end = new Date(step.ended_at).getTime();
  const origin = days[0].getTime();
  const startIndex = Math.max(0, Math.floor((start - origin) / DAY_MS));
  const endIndex = Math.min(
    days.length,
    Math.max(startIndex + 1, Math.ceil((end - origin) / DAY_MS))
  );
  if (startIndex >= days.length) return null;
  return { startIndex, span: Math.max(1, endIndex - startIndex) };
}

export function currentStepForEquipment(
  equipment: Equipment,
  jobs: ScheduleJob[],
  at = new Date()
): { job: ScheduleJob; step: JobStep } | null {
  const t = at.getTime();
  for (const job of jobs.map(withStepWindows)) {
    for (const step of job.steps) {
      if (step.equipment_id !== equipment.id || !step.started_at || !step.ended_at) {
        continue;
      }
      const start = new Date(step.started_at).getTime();
      const end = new Date(step.ended_at).getTime();
      if (t >= start && t < end) return { job, step };
    }
  }
  return null;
}
