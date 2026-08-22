import { formatHours } from "@/lib/erp/press-time";
import { buildFloorReport } from "@/lib/erp/report";
import type { DelayReason, ScheduleJob, ShopFloorClock } from "@/types";

export function DelayReport({
  jobs,
  clocks,
  reasons,
}: {
  jobs: ScheduleJob[];
  clocks: ShopFloorClock[];
  reasons: DelayReason[];
}) {
  const report = buildFloorReport(jobs, clocks, reasons);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white border rounded-3xl p-6">
        <h3 className="font-semibold mb-1">Planned vs actual</h3>
        <p className="text-xs text-slate-500 mb-4">
          Actual hours come from closed operator clocks. Late is versus job
          due date.
        </p>
        {report.jobs.length === 0 ? (
          <p className="text-sm text-slate-500">No jobs on the board yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {report.jobs.map((row) => (
              <li key={row.jobId} className="border-b pb-2">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs text-slate-500">
                      {row.jobNumber} · {row.status}
                    </div>
                    <div className="font-medium">{row.name}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div>
                      {formatHours(row.plannedHours)} planned ·{" "}
                      {formatHours(row.actualHours)} actual
                    </div>
                    <div
                      className={
                        row.late ? "text-red-600 font-semibold" : "text-slate-500"
                      }
                    >
                      {row.late ? "Late" : "On track"} vs due {row.dueDate}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 text-xs text-slate-500">
          {report.lateCount} late of {report.jobs.length} job
          {report.jobs.length === 1 ? "" : "s"}
        </div>
      </div>
      <div className="bg-white border rounded-3xl p-6">
        <h3 className="font-semibold mb-1">Hours by delay reason</h3>
        <p className="text-xs text-slate-500 mb-4">
          EXAMPLE reason codes — not a published Flexible Label delay taxonomy.
        </p>
        <ul className="space-y-2 text-sm">
          {report.byReason.map((row) => (
            <li key={row.code} className="flex justify-between border-b pb-2">
              <span>
                <span className="font-mono text-xs text-slate-500">{row.code}</span>{" "}
                {row.name}
              </span>
              <span>{formatHours(row.hours)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
