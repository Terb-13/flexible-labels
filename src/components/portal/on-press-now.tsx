import { formatHours } from "@/lib/erp/press-time";
import { clockHours } from "@/lib/erp/clocks";
import { onPressNow } from "@/lib/erp/report";
import type { Equipment, ScheduleJob, ShopFloorClock } from "@/types";

export function OnPressNow({
  clocks,
  jobs,
  equipment,
}: {
  clocks: ShopFloorClock[];
  jobs: ScheduleJob[];
  equipment: Equipment[];
}) {
  const live = onPressNow(clocks, jobs, equipment);

  return (
    <div className="bg-navy text-white rounded-3xl p-5">
      <div className="text-xs font-semibold tracking-wider text-teal">
        ON PRESS NOW
      </div>
      {live.length === 0 ? (
        <p className="text-sm text-slate-300 mt-2">
          No open setup or run clocks. Presses are idle.
        </p>
      ) : (
        <ul className="mt-3 grid md:grid-cols-2 gap-3">
          {live.map(({ clock, job, equipmentName }) => (
            <li
              key={clock.id}
              className="rounded-2xl bg-white/10 px-4 py-3 text-sm"
            >
              <div className="font-semibold">{equipmentName}</div>
              <div className="text-slate-200">
                {job?.job_number ?? "Job"} · {job?.name ?? "Open step"} ·{" "}
                {clock.activity}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Open {formatHours(clockHours(clock.started_at, null))}
                {clock.operator_name ? ` · ${clock.operator_name}` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
