import { clockHours } from "@/lib/erp/clocks";
import type {
  DelayCategory,
  DelayReason,
  ScheduleJob,
  ShopFloorClock,
} from "@/types";

export type JobVarianceRow = {
  jobId: string;
  jobNumber: string;
  name: string;
  plannedHours: number;
  actualHours: number;
  delayHours: number;
  dueDate: string;
  late: boolean;
  status: ScheduleJob["status"];
};

export type DelayReasonHours = {
  code: string;
  name: string;
  category: DelayCategory;
  hours: number;
};

export type FloorReport = {
  jobs: JobVarianceRow[];
  byReason: DelayReasonHours[];
  lateCount: number;
};

function isLate(job: ScheduleJob, at: Date): boolean {
  if (!job.due_date) return false;
  const due = new Date(`${job.due_date}T23:59:59`);
  if (!Number.isFinite(due.getTime())) return false;
  const finish =
    job.status === "done" && job.ended_at ? new Date(job.ended_at) : at;
  return finish.getTime() > due.getTime();
}

export function buildFloorReport(
  jobs: ScheduleJob[],
  clocks: ShopFloorClock[],
  reasons: DelayReason[],
  at = new Date()
): FloorReport {
  const rows: JobVarianceRow[] = jobs.map((job) => {
    const jobClocks = clocks.filter((c) =>
      job.steps.some((s) => s.id === c.job_step_id)
    );
    const closed = jobClocks.filter((c) => c.ended_at);
    const actualHours = closed.reduce(
      (sum, c) => sum + clockHours(c.started_at, c.ended_at, at),
      0
    );
    const delayHours = closed
      .filter((c) => c.activity === "delay")
      .reduce((sum, c) => sum + clockHours(c.started_at, c.ended_at, at), 0);
    const plannedHours = job.steps.reduce((sum, s) => sum + (s.planned_hours || 0), 0);
    return {
      jobId: job.id,
      jobNumber: job.job_number,
      name: job.name,
      plannedHours,
      actualHours,
      delayHours,
      dueDate: job.due_date,
      late: isLate(job, at),
      status: job.status,
    };
  });

  const byReason = reasons.map((reason) => {
    const hours = clocks
      .filter((c) => c.activity === "delay" && c.delay_reason_id === reason.id && c.ended_at)
      .reduce((sum, c) => sum + clockHours(c.started_at, c.ended_at, at), 0);
    return {
      code: reason.code,
      name: reason.name,
      category: reason.category,
      hours,
    };
  });

  return {
    jobs: rows,
    byReason,
    lateCount: rows.filter((r) => r.late).length,
  };
}

export function onPressNow(
  clocks: ShopFloorClock[],
  jobs: ScheduleJob[],
  equipment: { id: string; name: string }[] = []
): Array<{
  clock: ShopFloorClock;
  job: ScheduleJob | undefined;
  equipmentName: string;
}> {
  return clocks
    .filter((c) => c.ended_at == null && (c.activity === "setup" || c.activity === "run"))
    .map((clock) => {
      const job = jobs.find((j) => j.steps.some((s) => s.id === clock.job_step_id));
      const named = equipment.find((e) => e.id === clock.equipment_id);
      const step = job?.steps.find((s) => s.id === clock.job_step_id);
      return {
        clock,
        job,
        equipmentName: named?.name ?? step?.equipment?.name ?? clock.equipment_id,
      };
    });
}
