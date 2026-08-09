import { NextResponse } from "next/server";
import { z } from "zod";
import { recordCustomerResponse } from "@/lib/estimating/estimates-store";
import { WorkflowError } from "@/lib/estimating/workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  response: z.enum(["accepted", "request_changes"]),
  note: z.string().optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await ctx.params;
    const body = schema.parse(await req.json());
    const estimate = await recordCustomerResponse(
      token,
      body.response,
      body.note
    );
    return NextResponse.json({
      ok: true,
      customerResponse: estimate.customerResponse,
    });
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
