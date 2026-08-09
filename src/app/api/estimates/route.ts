import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppSession } from "@/lib/auth/session";
import { EstimatingEngine } from "@/lib/estimating/EstimatingEngine";
import { getRegisterSnapshot } from "@/lib/estimating/register-store";
import { MEMPHIS_PLANT_CODE } from "@/lib/estimating/register-types";
import type { EstimateInput } from "@/lib/estimating/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  family: z.enum(["pressure_sensitive", "shrink", "flex"]).default("pressure_sensitive"),
  productType: z.string().optional(),
  quantity: z.number().positive(),
  dimensions: z.object({
    widthIn: z.number().positive(),
    lengthIn: z.number().positive(),
    depthIn: z.number().optional(),
  }),
  material: z.object({
    id: z.string(),
    name: z.string(),
    family: z.enum(["pressure_sensitive", "shrink", "flex"]),
    costPerMsi: z.number().positive(),
  }),
  ink: z
    .object({
      colors: z.number().int().min(1).max(12),
      costPerMsi: z.number().optional(),
    })
    .optional(),
  finishing: z
    .object({
      laminate: z.boolean().optional(),
      varnish: z.boolean().optional(),
      dieCut: z.boolean().optional(),
      rewind: z.boolean().optional(),
    })
    .optional(),
  plantId: z.string().optional(),
  pressId: z.string().optional(),
  marginMultiplier: z.number().optional(),
  pricingMode: z.enum(["cost_plus", "contracted"]).optional(),
  across: z.number().optional(),
  mode: z.enum(["best", "tiers", "layouts"]).optional(),
});

export async function POST(req: Request) {
  const session = await getAppSession();
  if (!session?.isEmployee) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const body = inputSchema.parse(await req.json());
    const register = await getRegisterSnapshot();
    const engine = new EstimatingEngine({ register });
    const input: EstimateInput = {
      ...body,
      plantId: body.plantId ?? MEMPHIS_PLANT_CODE,
    };

    if (body.mode === "tiers") {
      return NextResponse.json({ estimates: engine.estimateTiers(input) });
    }
    if (body.mode === "layouts") {
      return NextResponse.json({ estimates: engine.estimateLayouts(input) });
    }
    const priced = engine.estimate(input);
    return NextResponse.json({
      estimate: priced,
      roleView: engine.forRole(priced, session.actorRole ?? "cx"),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Estimate failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
