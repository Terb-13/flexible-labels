"use client";

import { useMemo, useState } from "react";
import { clockInAction, clockOutAction } from "@/app/operations/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { openClockOnEquipment } from "@/lib/erp/clocks";
import { formatHours } from "@/lib/erp/press-time";
import type {
  ClockActivity,
  DelayReason,
  Equipment,
  ScheduleJob,
  ShopFloorClock,
} from "@/types";

const selectClass =
  "flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-teal";

export function OperatorClock({
  equipment,
  jobs,
  clocks,
  reasons,
  onClocksChange,
  onJobsChange,
}: {
  equipment: Equipment[];
  jobs: ScheduleJob[];
  clocks: ShopFloorClock[];
  reasons: DelayReason[];
  onClocksChange: (clocks: ShopFloorClock[]) => void;
  onJobsChange: (jobs: ScheduleJob[]) => void;
}) {
  const presses = equipment.filter((eq) => eq.stage === "printer");
  const [equipmentId, setEquipmentId] = useState(presses[0]?.id ?? "");
  const [activity, setActivity] = useState<ClockActivity>("setup");
  const [delayReasonId, setDelayReasonId] = useState(reasons[0]?.id ?? "");
  const [stepId, setStepId] = useState("");
  const [qtyGood, setQtyGood] = useState("");
  const [qtyWaste, setQtyWaste] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const queued = useMemo(() => {
    return jobs
      .flatMap((job) =>
        job.steps
          .filter((step) => step.equipment_id === equipmentId)
          .map((step) => ({ job, step }))
      )
      .sort((a, b) => {
        const aStart = a.step.started_at ? new Date(a.step.started_at).getTime() : 0;
        const bStart = b.step.started_at ? new Date(b.step.started_at).getTime() : 0;
        return aStart - bStart;
      });
  }, [jobs, equipmentId]);

  const open = openClockOnEquipment(clocks, equipmentId);
  const selectedStepId = stepId || queued[0]?.step.id || "";
  const selected = queued.find((q) => q.step.id === selectedStepId);

  async function clockIn() {
    if (!selectedStepId || !equipmentId) {
      toast("Pick a press and a queued job");
      return;
    }
    setBusy(true);
    try {
      const clock = await clockInAction({
        jobStepId: selectedStepId,
        equipmentId,
        activity,
        delayReasonId: activity === "delay" ? delayReasonId : null,
        notes: notes || null,
      });
      onClocksChange([clock, ...clocks.filter((c) => c.id !== clock.id)]);
      if (activity === "setup" || activity === "run") {
        onJobsChange(
          jobs.map((job) =>
            job.steps.some((s) => s.id === selectedStepId)
              ? {
                  ...job,
                  status: "running",
                  steps: job.steps.map((s) =>
                    s.id === selectedStepId ? { ...s, status: "running" } : s
                  ),
                }
              : job
          )
        );
      }
      toast(`Clocked in ${activity}`, true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not clock in");
    } finally {
      setBusy(false);
    }
  }

  async function clockOut() {
    if (!open) return;
    setBusy(true);
    try {
      const closed = await clockOutAction({
        clockId: open.id,
        qtyGood: qtyGood === "" ? null : Number(qtyGood),
        qtyWaste: qtyWaste === "" ? null : Number(qtyWaste),
        notes: notes || null,
      });
      onClocksChange(clocks.map((c) => (c.id === closed.id ? closed : c)));
      onJobsChange(
        jobs.map((job) =>
          job.steps.some((s) => s.id === closed.job_step_id)
            ? {
                ...job,
                status: "scheduled",
                steps: job.steps.map((s) =>
                  s.id === closed.job_step_id ? { ...s, status: "pending" } : s
                ),
              }
            : job
        )
      );
      setQtyGood("");
      setQtyWaste("");
      toast("Clocked out", true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not clock out");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border rounded-3xl p-6 space-y-4">
      <div>
        <h3 className="font-semibold">Operator clocks</h3>
        <p className="text-xs text-slate-500 mt-1">
          Employees only. One open clock per press. Delay requires a reason.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Press</Label>
          <select
            className={`${selectClass} mt-1`}
            value={equipmentId}
            onChange={(e) => {
              setEquipmentId(e.target.value);
              setStepId("");
            }}
          >
            {presses.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
                {eq.run_speed_fpm
                  ? ` · EXAMPLE ${eq.run_speed_fpm} fpm`
                  : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Queued job step</Label>
          <select
            className={`${selectClass} mt-1`}
            value={selectedStepId}
            onChange={(e) => setStepId(e.target.value)}
          >
            {queued.length === 0 ? (
              <option value="">No jobs on this press</option>
            ) : (
              queued.map(({ job, step }) => (
                <option key={step.id} value={step.id}>
                  {job.job_number} · {job.name} · {formatHours(step.planned_hours)}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {selected && (
        <div className="rounded-2xl bg-slate-50 p-3 text-sm">
          Next up: <span className="font-semibold">{selected.job.job_number}</span>{" "}
          {selected.job.name}
          {selected.step.production_feet
            ? ` · ${selected.step.production_feet.toLocaleString()} ft`
            : ""}
        </div>
      )}

      {open ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="text-sm font-semibold text-amber-900">
            Open {open.activity} clock — clock out to free this press
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Good qty</Label>
              <Input
                className="mt-1"
                type="number"
                min="0"
                value={qtyGood}
                onChange={(e) => setQtyGood(e.target.value)}
              />
            </div>
            <div>
              <Label>Waste qty</Label>
              <Input
                className="mt-1"
                type="number"
                min="0"
                value={qtyWaste}
                onChange={(e) => setQtyWaste(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={clockOut} disabled={busy}>
            {busy ? "Clocking out…" : "Clock out"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["setup", "run", "delay"] as ClockActivity[]).map((kind) => (
              <Button
                key={kind}
                type="button"
                size="sm"
                variant={activity === kind ? "teal" : "outline"}
                onClick={() => setActivity(kind)}
              >
                {kind}
              </Button>
            ))}
          </div>
          {activity === "delay" && (
            <div>
              <Label>Delay reason</Label>
              <select
                className={`${selectClass} mt-1`}
                value={delayReasonId}
                onChange={(e) => setDelayReasonId(e.target.value)}
              >
                {reasons.map((reason) => (
                  <option key={reason.id} value={reason.id}>
                    {reason.code} — {reason.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label>Notes</Label>
            <Input
              className="mt-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <Button onClick={clockIn} disabled={busy || !selectedStepId}>
            {busy ? "Clocking in…" : `Clock in ${activity}`}
          </Button>
        </div>
      )}
    </div>
  );
}
