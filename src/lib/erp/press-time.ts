/**
 * Press-floor footage and hours. Quantity is label count; press time uses
 * lineal feet and FPM — not labels / unitless speed.
 *
 *   production_feet = (quantity / across) * (repeat_in / 12)
 *   planned_press_hours = setup_time_minutes/60 + production_feet / run_speed_fpm
 *
 * Guards: across > 0, repeat_in > 0, run_speed_fpm > 0.
 */

export function productionFeet(
  quantity: number,
  across: number,
  repeatIn: number
): number {
  if (!(quantity > 0) || !(across > 0) || !(repeatIn > 0)) return 0;
  return (quantity / across) * (repeatIn / 12);
}

export function plannedPressHours(
  setupTimeMinutes: number,
  feet: number,
  runSpeedFpm: number
): number {
  if (!(runSpeedFpm > 0) || !(feet >= 0)) return 0;
  const setup = Math.max(setupTimeMinutes, 0) / 60;
  return setup + feet / runSpeedFpm;
}

export function roundHours(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function formatFeet(n: number): string {
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 1 })} ft`;
}

export function formatHours(n: number): string {
  return `${roundHours(n).toFixed(2)} h`;
}
