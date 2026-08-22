"use client";

import { useState } from "react";
import { rescheduleJobAction } from "@/app/operations/actions";
import { GanttScheduler } from "@/components/portal/gantt-scheduler";
import { OperationsEstimator } from "@/components/portal/operations-estimator";
import { currentStepForEquipment } from "@/lib/erp/calendar";
import type { Company, Equipment, Material, ScheduleJob } from "@/types";
import { useToast } from "@/components/ui/toaster";

export function OperationsClient({
  initialJobs,
  equipment,
  companies,
  materials,
}: {
  initialJobs: ScheduleJob[];
  equipment: Equipment[];
  companies: Company[];
  materials: Material[];
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const { toast } = useToast();

  async function onReschedule(jobId: string, startedAt: string) {
    try {
      const updated = await rescheduleJobAction(jobId, startedAt);
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not reschedule");
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="font-semibold text-xl">Production Gantt</h2>
        <GanttScheduler
          jobs={jobs}
          equipment={equipment}
          onReschedule={onReschedule}
        />
      </div>

      <div>
        <h2 className="font-semibold text-xl mb-4">Estimator</h2>
        <OperationsEstimator
          companies={companies}
          materials={materials}
          onJobCreated={(job) =>
            setJobs((prev) => {
              if (prev.some((j) => j.id === job.id)) return prev;
              return [...prev, job];
            })
          }
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-3xl p-6">
          <h3 className="font-semibold mb-3">Plant equipment</h3>
          <ul className="space-y-3 text-sm">
            {equipment.map((eq) => {
              const current = currentStepForEquipment(eq, jobs);
              return (
                <li key={eq.id} className="flex justify-between border-b pb-2">
                  <div>
                    <div className="font-medium">{eq.name}</div>
                    <div className="text-xs text-slate-500">
                      {eq.stage} · EXAMPLE ${eq.cost_rate}/hr ·{" "}
                      {eq.run_speed.toLocaleString()} /hr
                    </div>
                    <div className="text-xs text-slate-500">
                      {current
                        ? `${current.job.job_number} — ${current.job.name}`
                        : "Idle"}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-teal capitalize">
                    {eq.stage}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="bg-white border rounded-3xl p-6">
          <h3 className="font-semibold mb-3">Scheduled jobs</h3>
          {jobs.length === 0 ? (
            <p className="text-sm text-slate-500">
              Save and approve a quote, then generate a job ticket to put it on
              the calendar.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {jobs.map((job) => (
                <li key={job.id} className="border-b pb-2">
                  <div className="font-mono text-xs text-slate-500">
                    {job.job_number} · {job.status}
                  </div>
                  <div className="font-medium">{job.name}</div>
                  <div className="text-xs text-slate-500">
                    {job.steps.length} steps · due {job.due_date}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
