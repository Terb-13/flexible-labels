"use client";

import { useState } from "react";
import { GanttScheduler } from "@/components/portal/gantt-scheduler";
import type { ScheduleJob } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";

export function OperationsClient({
  initialJobs,
  days,
}: {
  initialJobs: ScheduleJob[];
  days: string[];
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-xl">Production Gantt Scheduler</h2>
        <Button onClick={() => toast("Job tickets generated for visible schedule.", true)}>
          Generate job tickets
        </Button>
      </div>
      <GanttScheduler jobs={jobs} days={days} onJobsChange={setJobs} />
    </div>
  );
}
