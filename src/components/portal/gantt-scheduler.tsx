"use client";

import { useMemo, useState } from "react";
import {
  calendarDays,
  formatDayLabel,
  stepSpan,
  withStepWindows,
} from "@/lib/erp/calendar";
import type { Equipment, ScheduleJob } from "@/types";
import { cn } from "@/lib/utils";

const STAGE_COLORS: Record<string, string> = {
  printer: "bg-teal",
  seamer: "bg-blue-500",
  finisher: "bg-purple-500",
  shipping: "bg-emerald-600",
};

export function GanttScheduler({
  jobs,
  equipment,
  runningEquipmentIds = [],
  onReschedule,
}: {
  jobs: ScheduleJob[];
  equipment: Equipment[];
  runningEquipmentIds?: string[];
  onReschedule?: (jobId: string, startedAt: string) => void;
}) {
  const datedJobs = useMemo(() => jobs.map(withStepWindows), [jobs]);
  const days = useMemo(() => calendarDays(datedJobs, 14), [datedJobs]);
  const [dragJob, setDragJob] = useState<string | null>(null);

  function handleDrop(day: Date) {
    if (!dragJob || !onReschedule) return;
    onReschedule(dragJob, day.toISOString());
    setDragJob(null);
  }

  const rows = equipment.length
    ? equipment
    : [{ id: "none", name: "No equipment", stage: "printer" as const }];

  return (
    <div className="border rounded-2xl bg-white overflow-hidden">
      <div className="p-3 bg-slate-50 border-b flex items-center justify-between text-xs font-semibold">
        <div>Press board — jobs by asset</div>
        <div className="text-slate-500 font-medium">
          {datedJobs.length} job{datedJobs.length === 1 ? "" : "s"}
        </div>
      </div>
      <div className="p-4 overflow-x-auto min-h-[340px]">
        <div
          className="grid gap-1 mb-1 text-center min-w-[900px]"
          style={{ gridTemplateColumns: `160px repeat(${days.length}, 1fr)` }}
        >
          <div />
          {days.map((d) => (
            <div key={d.toISOString()} className="gantt-day">
              {formatDayLabel(d)}
            </div>
          ))}
        </div>
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid gap-1 mb-2 min-w-[900px] relative"
            style={{ gridTemplateColumns: `160px repeat(${days.length}, 1fr)` }}
          >
            <div className="text-[11px] font-semibold text-slate-600 pr-2 flex items-center gap-1">
              <span>{row.name}</span>
              {runningEquipmentIds.includes(row.id) && (
                <span className="text-[9px] uppercase tracking-wide text-teal">
                  run
                </span>
              )}
            </div>
            {days.map((day) => (
              <div
                key={`${row.id}-${day.toISOString()}`}
                className="h-9 bg-slate-50 border border-slate-100 rounded"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(day)}
              />
            ))}
            {datedJobs.flatMap((job) =>
              job.steps
                .filter((step) => step.equipment_id === row.id)
                .map((step) => {
                  const span = stepSpan(step, days);
                  if (!span) return null;
                  return (
                    <div
                      key={step.id}
                      draggable={Boolean(onReschedule)}
                      onDragStart={() => setDragJob(job.id)}
                      className={cn(
                        "gantt-bar absolute top-1 h-7 text-[10px] flex items-center px-2 font-semibold text-white rounded shadow-sm z-10",
                        STAGE_COLORS[row.stage] ?? "bg-slate-600"
                      )}
                      style={{
                        left: `calc(160px + ((100% - 160px) / ${days.length}) * ${span.startIndex} + 4px)`,
                        width: `calc(((100% - 160px) / ${days.length}) * ${span.span} - 8px)`,
                      }}
                      title={`${job.job_number} • ${job.name} • ${step.planned_hours}h${
                        step.production_feet
                          ? ` • ${step.production_feet} ft`
                          : ""
                      }`}
                    >
                      {job.job_number}
                    </div>
                  );
                })
            )}
          </div>
        ))}
      </div>
      <div className="px-4 py-2 bg-slate-50 border-t text-xs flex flex-wrap gap-4 text-slate-600">
        {Object.entries(STAGE_COLORS).map(([name, color]) => (
          <div key={name}>
            <span className={cn("inline-block w-2 h-2 rounded-full mr-1", color)} />
            {name}
          </div>
        ))}
      </div>
      <div className="text-xs text-slate-500 mt-2 px-4 pb-3">
        Drag a bar to a day. The scheduler snaps to plant shift hours and will
        not overlap another block on the same press.
      </div>
    </div>
  );
}
