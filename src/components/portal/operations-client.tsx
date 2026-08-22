"use client";

import { useState } from "react";
import { rescheduleJobAction } from "@/app/operations/actions";
import { DelayReport } from "@/components/portal/delay-report";
import { GanttScheduler } from "@/components/portal/gantt-scheduler";
import { OnPressNow } from "@/components/portal/on-press-now";
import { OperatorClock } from "@/components/portal/operator-clock";
import { OperationsEstimator } from "@/components/portal/operations-estimator";
import { openClockOnEquipment } from "@/lib/erp/clocks";
import type {
  Company,
  DelayReason,
  Equipment,
  Material,
  PlantShift,
  ScheduleJob,
  ShopFloorClock,
} from "@/types";
import { useToast } from "@/components/ui/toaster";

export function OperationsClient({
  initialJobs,
  initialClocks,
  equipment,
  companies,
  materials,
  reasons,
  shifts,
}: {
  initialJobs: ScheduleJob[];
  initialClocks: ShopFloorClock[];
  equipment: Equipment[];
  companies: Company[];
  materials: Material[];
  reasons: DelayReason[];
  shifts: PlantShift[];
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [clocks, setClocks] = useState(initialClocks);
  const { toast } = useToast();

  async function onReschedule(jobId: string, startedAt: string) {
    try {
      const updated = await rescheduleJobAction(jobId, startedAt);
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not reschedule");
    }
  }

  const shiftLabel = shifts.length
    ? `EXAMPLE plant window ${shifts[0].start_time}–${shifts[0].end_time} Mon–Fri`
    : "No plant shifts";

  return (
    <div className="space-y-8">
      <OnPressNow clocks={clocks} jobs={jobs} equipment={equipment} />

      <div className="space-y-4">
        <div>
          <h2 className="font-semibold text-xl">Press floor</h2>
          <p className="text-sm text-slate-500">
            Finite board — one running clock per press. {shiftLabel}. Not a full
            APS.
          </p>
        </div>
        <GanttScheduler
          jobs={jobs}
          equipment={equipment}
          runningEquipmentIds={equipment
            .filter((eq) => openClockOnEquipment(clocks, eq.id))
            .map((eq) => eq.id)}
          onReschedule={onReschedule}
        />
      </div>

      <OperatorClock
        equipment={equipment}
        jobs={jobs}
        clocks={clocks}
        reasons={reasons}
        onClocksChange={setClocks}
        onJobsChange={setJobs}
      />

      <div>
        <h2 className="font-semibold text-xl mb-4">Owner board</h2>
        <DelayReport jobs={jobs} clocks={clocks} reasons={reasons} />
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
    </div>
  );
}
