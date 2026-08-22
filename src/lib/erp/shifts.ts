import type { JobStep, PlantShift, ScheduleJob } from "@/types";

export type TimeInterval = { start: Date; end: Date };

function parseHm(hm: string): { h: number; m: number } {
  const [h, m] = hm.split(":").map(Number);
  return { h: Number.isFinite(h) ? h : 0, m: Number.isFinite(m) ? m : 0 };
}

function onDay(date: Date, hm: string): Date {
  const { h, m } = parseHm(hm);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0);
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function shiftWindowOn(
  day: Date,
  shifts: PlantShift[]
): TimeInterval | null {
  const match = shifts.find((s) => s.weekday === day.getDay());
  if (!match) return null;
  const start = onDay(day, match.start_time);
  const end = onDay(day, match.end_time);
  if (end.getTime() <= start.getTime()) return null;
  return { start, end };
}

/** Push a timestamp forward into the next plant shift window. */
export function snapToShift(from: Date, shifts: PlantShift[]): Date {
  if (!shifts.length) return from;
  for (let i = 0; i < 21; i++) {
    const day = addLocalDays(startOfLocalDay(from), i);
    const win = shiftWindowOn(day, shifts);
    if (!win) continue;
    if (from.getTime() <= win.start.getTime()) return win.start;
    if (from.getTime() < win.end.getTime()) return from;
  }
  return from;
}

function skipOccupied(cursor: Date, occupied: TimeInterval[]): Date {
  let t = cursor.getTime();
  let moved = true;
  while (moved) {
    moved = false;
    for (const block of occupied) {
      if (t >= block.start.getTime() && t < block.end.getTime()) {
        t = block.end.getTime();
        moved = true;
      }
    }
  }
  return new Date(t);
}

function nextOccupiedStart(
  cursor: Date,
  windowEnd: Date,
  occupied: TimeInterval[]
): Date {
  let soonest = windowEnd.getTime();
  for (const block of occupied) {
    if (block.end.getTime() <= cursor.getTime()) continue;
    if (block.start.getTime() >= soonest) continue;
    if (block.start.getTime() <= cursor.getTime()) continue;
    soonest = block.start.getTime();
  }
  return new Date(soonest);
}

/**
 * Place `hours` of work starting at/after `from`, only inside plant shifts,
 * skipping occupied blocks on the same asset. Stores a single start→end span
 * (nights/weekends between shift segments are included in the span).
 */
export function allocateShiftWindow(
  from: Date,
  hours: number,
  occupied: TimeInterval[],
  shifts: PlantShift[]
): TimeInterval {
  const neededMs = Math.max(hours, 0.05) * 3600 * 1000;
  let remaining = neededMs;
  let cursor = snapToShift(skipOccupied(from, occupied), shifts);
  let firstStart: Date | null = null;
  let lastEnd = cursor;
  let guard = 0;

  while (remaining > 0 && guard++ < 400) {
    const win = shiftWindowOn(startOfLocalDay(cursor), shifts);
    if (!win || cursor.getTime() >= win.end.getTime()) {
      cursor = snapToShift(addLocalDays(startOfLocalDay(cursor), 1), shifts);
      cursor = skipOccupied(cursor, occupied);
      continue;
    }
    cursor = skipOccupied(cursor, occupied);
    if (cursor.getTime() < win.start.getTime()) cursor = win.start;
    if (cursor.getTime() >= win.end.getTime()) continue;

    const freeEnd = nextOccupiedStart(cursor, win.end, occupied);
    const available = freeEnd.getTime() - cursor.getTime();
    if (available <= 0) {
      cursor = new Date(cursor.getTime() + 60 * 1000);
      continue;
    }
    const take = Math.min(available, remaining);
    if (!firstStart) firstStart = new Date(cursor);
    cursor = new Date(cursor.getTime() + take);
    lastEnd = cursor;
    remaining -= take;
  }

  return {
    start: firstStart ?? snapToShift(from, shifts),
    end: lastEnd,
  };
}

export function occupiedForEquipment(
  jobs: ScheduleJob[],
  equipmentId: string,
  excludeJobId?: string
): TimeInterval[] {
  const intervals: TimeInterval[] = [];
  for (const job of jobs) {
    if (excludeJobId && job.id === excludeJobId) continue;
    for (const step of job.steps) {
      if (step.equipment_id !== equipmentId || !step.started_at || !step.ended_at) {
        continue;
      }
      intervals.push({
        start: new Date(step.started_at),
        end: new Date(step.ended_at),
      });
    }
  }
  return intervals;
}

export function intervalsOverlap(a: TimeInterval, b: TimeInterval): boolean {
  return a.start.getTime() < b.end.getTime() && a.end.getTime() > b.start.getTime();
}

export function stepsOverlapOnEquipment(
  jobs: ScheduleJob[],
  equipmentId: string
): boolean {
  const blocks = occupiedForEquipment(jobs, equipmentId);
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      if (intervalsOverlap(blocks[i], blocks[j])) return true;
    }
  }
  return false;
}

export function scheduleJobSteps(input: {
  steps: JobStep[];
  from: Date;
  jobs: ScheduleJob[];
  shifts: PlantShift[];
  excludeJobId?: string;
}): { steps: JobStep[]; startedAt: string; endedAt: string } {
  let cursor = input.from;
  const steps = input.steps.map((step) => {
    const occupied = occupiedForEquipment(
      input.jobs,
      step.equipment_id,
      input.excludeJobId
    );
    const window = allocateShiftWindow(
      cursor,
      step.planned_hours || 0.25,
      occupied,
      input.shifts
    );
    cursor = window.end;
    return {
      ...step,
      started_at: window.start.toISOString(),
      ended_at: window.end.toISOString(),
    };
  });
  return {
    steps,
    startedAt: steps[0]?.started_at ?? input.from.toISOString(),
    endedAt: steps[steps.length - 1]?.ended_at ?? input.from.toISOString(),
  };
}
