"use client";

import { EstimatorWorkspace } from "@/components/portal/estimator-workspace";
import type {
  Company,
  Equipment,
  Material,
  QuoteSpec,
  SavedQuote,
  ScheduleJob,
} from "@/types";

export function OperationsEstimator({
  companies,
  materials,
  equipment,
  onJobCreated,
  onQuoteSaved,
  initialSpec,
  initialStep,
  wizardKey,
}: {
  companies: Company[];
  materials: Material[];
  equipment: Equipment[];
  onJobCreated?: (job: ScheduleJob) => void;
  onQuoteSaved?: (quote: SavedQuote) => void;
  initialSpec?: QuoteSpec;
  initialStep?: number;
  wizardKey?: number;
}) {
  return (
    <div id="new-estimate">
      <EstimatorWorkspace
        key={wizardKey ?? 0}
        mode="employee"
        materials={materials}
        equipment={equipment}
        companies={companies}
        initialSpec={initialSpec}
        initialStep={initialStep}
        onJobCreated={onJobCreated}
        onQuoteSaved={onQuoteSaved}
      />
    </div>
  );
}
