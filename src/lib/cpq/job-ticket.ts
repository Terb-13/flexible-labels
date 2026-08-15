import type { JobTicket, ScheduleJob } from "@/types";

function formatQty(qty: number): string {
  if (qty >= 1000) return `${(qty / 1000).toFixed(qty % 1000 === 0 ? 0 : 1)}k`;
  return String(qty);
}

function durationDays(ticket: JobTicket): number {
  const minutes = Math.max(ticket.quantity / 4000, 1) * 60;
  return Math.min(4, Math.max(1, Math.ceil(minutes / (8 * 60))));
}

/** Place an approved Job Ticket onto the existing Gantt resource lanes. */
export function ticketToScheduleJob(
  ticket: JobTicket,
  existing: ScheduleJob[]
): ScheduleJob {
  const sameResource = existing.filter((j) => j.resource === ticket.recommendedResource);
  const lastEnd = sameResource.reduce((max, j) => Math.max(max, j.start_day + j.duration), 0);
  const duration = durationDays(ticket);
  const startDay = Math.min(lastEnd, 14);

  return {
    id: ticket.id,
    job_number: ticket.ticketNumber,
    name: `${ticket.companyName} ${ticket.productType}`,
    quantity: formatQty(ticket.quantity),
    resource: ticket.recommendedResource,
    start_day: startDay,
    duration,
    due_date: "TBD — from ticket",
    material: ticket.materialName,
    company_id: ticket.companyId,
  };
}
