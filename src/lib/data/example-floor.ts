import type { DelayReason, PlantShift } from "@/types";

/**
 * EXAMPLE shop-floor reference data. Not Flexible Label’s real delay
 * taxonomy or published plant shift policy.
 */
export const EXAMPLE_FLOOR_DISCLAIMER =
  "EXAMPLE plant window — not a published Flexible Label shift policy.";

export const EXAMPLE_DELAY_REASONS: DelayReason[] = [
  {
    id: "55555555-5555-4000-8000-000000000001",
    code: "WAIT_MAT",
    name: "EXAMPLE wait — material",
    category: "wait_material",
  },
  {
    id: "55555555-5555-4000-8000-000000000002",
    code: "WAIT_ART",
    name: "EXAMPLE wait — art / approval",
    category: "wait_art",
  },
  {
    id: "55555555-5555-4000-8000-000000000003",
    code: "BREAK",
    name: "EXAMPLE breakdown",
    category: "breakdown",
  },
  {
    id: "55555555-5555-4000-8000-000000000004",
    code: "CHGOVR",
    name: "EXAMPLE changeover",
    category: "changeover",
  },
  {
    id: "55555555-5555-4000-8000-000000000005",
    code: "OPER",
    name: "EXAMPLE operator unavailable",
    category: "operator",
  },
  {
    id: "55555555-5555-4000-8000-000000000006",
    code: "QUAL",
    name: "EXAMPLE quality hold",
    category: "quality",
  },
  {
    id: "55555555-5555-4000-8000-000000000007",
    code: "OTHER",
    name: "EXAMPLE other",
    category: "other",
  },
];

const WEEKDAY_IDS = [
  "66666666-6666-4000-8000-000000000001",
  "66666666-6666-4000-8000-000000000002",
  "66666666-6666-4000-8000-000000000003",
  "66666666-6666-4000-8000-000000000004",
  "66666666-6666-4000-8000-000000000005",
] as const;

/** EXAMPLE Mon–Fri 07:00–15:00. No overtime / weekend rules. */
export const EXAMPLE_PLANT_SHIFTS: PlantShift[] = [1, 2, 3, 4, 5].map(
  (weekday, i) => ({
    id: WEEKDAY_IDS[i],
    weekday,
    start_time: "07:00",
    end_time: "15:00",
    notes: EXAMPLE_FLOOR_DISCLAIMER,
  })
);
