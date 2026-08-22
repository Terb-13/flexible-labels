import type { ClockActivity, ShopFloorClock } from "@/types";

export class ClockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClockError";
  }
}

export function openClockOnEquipment(
  clocks: ShopFloorClock[],
  equipmentId: string
): ShopFloorClock | undefined {
  return clocks.find((c) => c.equipment_id === equipmentId && c.ended_at == null);
}

export function openClocks(clocks: ShopFloorClock[]): ShopFloorClock[] {
  return clocks.filter((c) => c.ended_at == null);
}

export function assertCanClockIn(input: {
  clocks: ShopFloorClock[];
  equipmentId: string;
  activity: ClockActivity;
  delayReasonId?: string | null;
}): void {
  const open = openClockOnEquipment(input.clocks, input.equipmentId);
  if (open) {
    throw new ClockError("This press already has an open clock");
  }
  if (input.activity === "delay" && !input.delayReasonId) {
    throw new ClockError("Delay requires a reason code");
  }
}

export function clockHours(
  startedAt: string,
  endedAt: string | null,
  at = new Date()
): number {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : at.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return (end - start) / 3600000;
}

export function runningJobsOnEquipment(
  clocks: ShopFloorClock[],
  equipmentId: string
): ShopFloorClock[] {
  return clocks.filter(
    (c) =>
      c.equipment_id === equipmentId &&
      c.ended_at == null &&
      (c.activity === "run" || c.activity === "setup")
  );
}
