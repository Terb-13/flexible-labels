import assert from "node:assert/strict";
import {
  EXAMPLE_CATALOG,
  EXAMPLE_DTC_COMPANY,
  EXAMPLE_EQUIPMENT,
  EXAMPLE_FPM_DISCLAIMER,
  EXAMPLE_RATE_DISCLAIMER,
} from "../src/lib/data/example-catalog";
import {
  EXAMPLE_DELAY_REASONS,
  EXAMPLE_FLOOR_DISCLAIMER,
  EXAMPLE_PLANT_SHIFTS,
} from "../src/lib/data/example-floor";
import { assertCanClockIn, ClockError } from "../src/lib/erp/clocks";
import {
  plannedPressHours,
  productionFeet,
  roundHours,
} from "../src/lib/erp/press-time";
import {
  allocateShiftWindow,
  scheduleJobSteps,
  stepsOverlapOnEquipment,
} from "../src/lib/erp/shifts";
import { calculateQuote } from "../src/lib/pricing/engine";
import type { JobStep, ScheduleJob, ShopFloorClock } from "../src/types";

const quantity = 10000;
const across = 2;
const repeatIn = 3.5;
const expectedFeet = (quantity / across) * (repeatIn / 12);
assert.equal(productionFeet(quantity, across, repeatIn), expectedFeet);
assert.equal(productionFeet(quantity, 0, repeatIn), 0);
assert.equal(productionFeet(quantity, across, 0), 0);
assert.equal(plannedPressHours(15, expectedFeet, 0), 0);

const digital = EXAMPLE_EQUIPMENT.find((e) => e.name === "EXAMPLE Digital Press");
assert.ok(digital);
assert.equal(digital.run_speed_unit, "fpm");
assert.equal(digital.run_speed_fpm, 150);
assert.ok(digital.notes?.includes("EXAMPLE"));
assert.ok(EXAMPLE_FPM_DISCLAIMER.includes("EXAMPLE"));
assert.ok(EXAMPLE_RATE_DISCLAIMER.includes("EXAMPLE"));
assert.ok(EXAMPLE_FLOOR_DISCLAIMER.includes("EXAMPLE"));
assert.ok(EXAMPLE_EQUIPMENT.every((eq) => eq.notes?.includes("EXAMPLE")));
assert.ok(EXAMPLE_DELAY_REASONS.every((r) => r.name.includes("EXAMPLE")));

const pressHours = plannedPressHours(15, expectedFeet, 150);
assert.equal(roundHours(pressHours), roundHours(15 / 60 + expectedFeet / 150));

const quote = calculateQuote(
  {
    product: "Roll Labels",
    type: "Prime / pressure-sensitive",
    material: "Matte BOPP",
    widthIn: 2.25,
    heightIn: 3.5,
    quantity,
    colors: 4,
    repeatIn,
    across,
  },
  EXAMPLE_DTC_COMPANY,
  EXAMPLE_CATALOG
);
assert.ok(Math.abs(quote.productionFeet - expectedFeet) < 0.01);
assert.ok(Math.abs(quote.plannedPressHours - pressHours) < 0.01);
assert.equal(quote.catalogSource, "example");

const open: ShopFloorClock = {
  id: "clock-1",
  job_step_id: "step-1",
  equipment_id: digital.id,
  operator_id: null,
  activity: "run",
  started_at: new Date().toISOString(),
  ended_at: null,
  delay_reason_id: null,
  notes: null,
  qty_good: null,
  qty_waste: null,
};

assert.throws(
  () =>
    assertCanClockIn({
      clocks: [open],
      equipmentId: digital.id,
      activity: "run",
    }),
  ClockError
);

assert.throws(
  () =>
    assertCanClockIn({
      clocks: [],
      equipmentId: digital.id,
      activity: "delay",
      delayReasonId: null,
    }),
  /Delay requires a reason code/
);

assertCanClockIn({
  clocks: [],
  equipmentId: digital.id,
  activity: "delay",
  delayReasonId: EXAMPLE_DELAY_REASONS[0].id,
});

const saturday3am = new Date(2026, 7, 22, 3, 0, 0, 0);
assert.equal(saturday3am.getDay(), 6);
const first = allocateShiftWindow(saturday3am, 2, [], EXAMPLE_PLANT_SHIFTS);
assert.equal(first.start.getDay(), 1);
assert.equal(first.start.getHours(), 7);
assert.equal(first.end.getHours(), 9);

const second = allocateShiftWindow(saturday3am, 2, [first], EXAMPLE_PLANT_SHIFTS);
assert.ok(second.start.getTime() >= first.end.getTime());

const press = EXAMPLE_EQUIPMENT.find((e) => e.stage === "printer")!;
function fakeStep(id: string, hours: number): JobStep {
  return {
    id,
    job_id: "job",
    equipment_id: press.id,
    route_step_id: null,
    planned_hours: hours,
    actual_hours: null,
    actual_waste: null,
    status: "pending",
    step_order: 1,
    production_feet: expectedFeet,
    repeat_in: repeatIn,
    across,
  };
}

const placedA = scheduleJobSteps({
  steps: [fakeStep("a", 3)],
  from: saturday3am,
  jobs: [],
  shifts: EXAMPLE_PLANT_SHIFTS,
});
const jobA: ScheduleJob = {
  id: "job-a",
  job_number: "J-1",
  name: "A",
  quantity: "10000",
  company_id: EXAMPLE_DTC_COMPANY.id,
  material: "Matte BOPP",
  due_date: "2026-08-28",
  quote_id: null,
  order_id: null,
  started_at: placedA.startedAt,
  ended_at: placedA.endedAt,
  status: "scheduled",
  steps: placedA.steps.map((s) => ({ ...s, job_id: "job-a" })),
};
const placedB = scheduleJobSteps({
  steps: [fakeStep("b", 3)],
  from: saturday3am,
  jobs: [jobA],
  shifts: EXAMPLE_PLANT_SHIFTS,
});
const jobB: ScheduleJob = {
  ...jobA,
  id: "job-b",
  job_number: "J-2",
  steps: placedB.steps.map((s) => ({ ...s, job_id: "job-b" })),
};
assert.equal(stepsOverlapOnEquipment([jobA, jobB], press.id), false);

console.log("Press-floor checks passed.");
console.log(
  `${expectedFeet.toFixed(1)} ft / EXAMPLE 150 fpm → ${pressHours.toFixed(2)} h`
);
