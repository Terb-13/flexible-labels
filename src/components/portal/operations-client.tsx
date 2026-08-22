"use client";

import { useState } from "react";
import { rescheduleJobAction } from "@/app/operations/actions";
import { DelayReport } from "@/components/portal/delay-report";
import { EstimateQueue } from "@/components/portal/estimate-queue";
import { GanttScheduler } from "@/components/portal/gantt-scheduler";
import { OnPressNow } from "@/components/portal/on-press-now";
import { OperatorClock } from "@/components/portal/operator-clock";
import { OperationsEstimator } from "@/components/portal/operations-estimator";
import { RfpIntake } from "@/components/portal/rfp-intake";
import { Button } from "@/components/ui/button";
import { openClockOnEquipment } from "@/lib/erp/clocks";
import type {
  Company,
  DelayReason,
  Equipment,
  Material,
  PlantShift,
  QuoteSpec,
  SavedQuote,
  ScheduleJob,
  ShopFloorClock,
} from "@/types";
import { useToast } from "@/components/ui/toaster";

export function OperationsClient({
  initialJobs,
  initialClocks,
  initialQuotes,
  equipment,
  companies,
  materials,
  reasons,
  shifts,
}: {
  initialJobs: ScheduleJob[];
  initialClocks: ShopFloorClock[];
  initialQuotes: SavedQuote[];
  equipment: Equipment[];
  companies: Company[];
  materials: Material[];
  reasons: DelayReason[];
  shifts: PlantShift[];
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [clocks, setClocks] = useState(initialClocks);
  const [quotes, setQuotes] = useState(initialQuotes);
  const [wizardKey, setWizardKey] = useState(0);
  const [prefill, setPrefill] = useState<QuoteSpec | undefined>(undefined);
  const [startStep, setStartStep] = useState(0);
  const { toast } = useToast();

  async function onReschedule(jobId: string, startedAt: string) {
    try {
      const updated = await rescheduleJobAction(jobId, startedAt);
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not reschedule");
    }
  }

  function startNewEstimate(spec?: QuoteSpec, ready = false) {
    setPrefill(spec);
    setStartStep(ready ? 6 : 0);
    setWizardKey((k) => k + 1);
    window.setTimeout(() => {
      document.getElementById("new-estimate")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  const shiftLabel = shifts.length
    ? `EXAMPLE plant window ${shifts[0].start_time}–${shifts[0].end_time} Mon–Fri`
    : "No plant shifts";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-xl">Estimating</h2>
          <p className="text-sm text-slate-500">
            Pick a customer first (the account this quote is for), then walk the
            same 7-step wizard as /quote. Production route is chosen
            automatically from the specs.
          </p>
        </div>
        <Button variant="cta" onClick={() => startNewEstimate()}>
          New estimate
        </Button>
      </div>

      <EstimateQueue quotes={quotes} companies={companies} />
      <RfpIntake onCreate={(spec, ready) => startNewEstimate(spec, ready)} />

      <OperationsEstimator
        companies={companies}
        materials={materials}
        equipment={equipment}
        wizardKey={wizardKey}
        initialSpec={prefill}
        initialStep={startStep}
        onQuoteSaved={(quote) =>
          setQuotes((prev) => [quote, ...prev.filter((q) => q.id !== quote.id)])
        }
        onJobCreated={(job) =>
          setJobs((prev) => {
            if (prev.some((j) => j.id === job.id)) return prev;
            return [...prev, job];
          })
        }
      />

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
    </div>
  );
}
