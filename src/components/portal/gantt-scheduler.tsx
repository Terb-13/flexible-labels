"use client";

import { useState } from "react";
import { RESOURCE_COLORS } from "@/lib/data/demo-data";
import type { ScheduleJob } from "@/types";
import { cn } from "@/lib/utils";

export function GanttScheduler({
  jobs,
  days,
  onJobsChange,
}: {
  jobs: ScheduleJob[];
  days: string[];
  onJobsChange: (jobs: ScheduleJob[]) => void;
}) {
  const resources = [
    "Press Line 1 (Flexo)",
    "Press Line 2 (Flexo)",
    "Digital Press",
    "Finishing Line",
    "Rewind / Inspection",
  ];
  const [dragJob, setDragJob] = useState<string | null>(null);

  function handleDrop(resource: string, dayIndex: number) {
    if (!dragJob) return;
    onJobsChange(
      jobs.map((j) =>
        j.id === dragJob ? { ...j, resource, start_day: dayIndex } : j
      )
    );
    setDragJob(null);
  }

  return (
    <div className="border rounded-2xl bg-white overflow-hidden">
      <div className="p-3 bg-slate-50 border-b flex items-center justify-between text-xs font-semibold">
        <div>Production Timeline — March 2026</div>
        <div className="text-emerald-600">Capacity: 87% utilized</div>
      </div>
      <div className="p-4 overflow-x-auto min-h-[340px]">
        <div
          className="grid gap-1 mb-1 text-center min-w-[900px]"
          style={{ gridTemplateColumns: `140px repeat(${days.length}, 1fr)` }}
        >
          <div />
          {days.map((d) => (
            <div key={d} className="gantt-day">
              {d}
            </div>
          ))}
        </div>
        {resources.map((resource) => (
          <div
            key={resource}
            className="grid gap-1 mb-2 min-w-[900px] relative"
            style={{ gridTemplateColumns: `140px repeat(${days.length}, 1fr)` }}
          >
            <div className="text-[11px] font-semibold text-slate-600 pr-2 flex items-center">
              {resource.replace(" (Flexo)", "")}
            </div>
            {days.map((_, dayIdx) => (
              <div
                key={`${resource}-${dayIdx}`}
                className="h-9 bg-slate-50 border border-slate-100 rounded"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(resource, dayIdx)}
              />
            ))}
            {jobs
              .filter((j) => j.resource === resource)
              .map((job) => (
                <div
                  key={job.id}
                  draggable
                  onDragStart={() => setDragJob(job.id)}
                  className={cn(
                    "gantt-bar absolute top-1 h-7 text-[10px] flex items-center px-2 font-semibold text-white rounded shadow-sm z-10",
                    RESOURCE_COLORS[resource] ?? "bg-slate-600"
                  )}
                  style={{
                    left: `calc(140px + ((100% - 140px) / ${days.length}) * ${job.start_day} + 4px)`,
                    width: `calc(((100% - 140px) / ${days.length}) * ${job.duration} - 8px)`,
                  }}
                  title={`${job.job_number} • ${job.name}`}
                >
                  {job.job_number}
                </div>
              ))}
          </div>
        ))}
      </div>
      <div className="px-4 py-2 bg-slate-50 border-t text-xs flex flex-wrap gap-4 text-slate-600">
        {Object.entries(RESOURCE_COLORS).map(([name, color]) => (
          <div key={name}>
            <span className={cn("inline-block w-2 h-2 rounded-full mr-1", color)} />
            {name}
          </div>
        ))}
      </div>
      <div className="text-xs text-slate-500 mt-2 px-4 pb-3">
        Drag bars to reschedule jobs. Click a bar for details. Internal use only.
      </div>
    </div>
  );
}
