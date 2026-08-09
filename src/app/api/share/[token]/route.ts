import { NextResponse } from "next/server";
import { getEstimateByShareToken } from "@/lib/estimating/estimates-store";
import { filterEstimateForRole } from "@/lib/estimating/role-filter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  const estimate = await getEstimateByShareToken(token);
  if (!estimate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const customerView = filterEstimateForRole(estimate.payload, "customer");
  return NextResponse.json({
    id: estimate.id,
    customerName: estimate.customerName,
    productLabel: estimate.productLabel,
    quantity: estimate.quantity,
    status: estimate.status,
    customerResponse: estimate.customerResponse,
    customerResponseNote: estimate.customerResponseNote,
    view: customerView,
  });
}
