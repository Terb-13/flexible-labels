import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppSession } from "@/lib/auth/session";
import {
  getRegisterSnapshot,
  registerHealth,
  resetRegisterToSeed,
  saveRegisterSnapshot,
  updateAsset,
} from "@/lib/estimating/register-store";
import type { RegisterSnapshot } from "@/lib/estimating/register-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAppSession();
  if (!session?.isEmployee) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const snapshot = await getRegisterSnapshot();
  return NextResponse.json({
    snapshot,
    health: registerHealth(snapshot),
  });
}

const patchSchema = z.object({
  assetTag: z.string(),
  patch: z.object({
    status: z.string().optional(),
    avgSpeedFpm: z.number().optional(),
    maxSpeedFpm: z.number().optional(),
    maxMaterialWidthIn: z.number().optional(),
    widthIn: z.number().optional(),
    colorStations: z.number().int().optional(),
    avgMrMinutes: z.number().optional(),
    avgMrMinutesPerColor: z.number().optional(),
    equipNumber: z.string().optional(),
    manufacturer: z.string().optional(),
    model: z.string().optional(),
  }),
});

export async function PATCH(req: Request) {
  const session = await getAppSession();
  if (!session?.isEmployee) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const body = patchSchema.parse(await req.json());
    const asset = await updateAsset(body.assetTag, body.patch);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    return NextResponse.json({ asset });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const session = await getAppSession();
  if (!session?.isEmployee) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const body = await req.json();
    if (body.reset === true) {
      const snapshot = await resetRegisterToSeed();
      return NextResponse.json({ snapshot, health: registerHealth(snapshot) });
    }
    const snapshot = body.snapshot as RegisterSnapshot;
    if (!snapshot?.plants?.length || !snapshot.assets || !snapshot.routes) {
      return NextResponse.json(
        { error: "Invalid register snapshot" },
        { status: 400 }
      );
    }
    const saved = await saveRegisterSnapshot(snapshot);
    return NextResponse.json({ snapshot: saved, health: registerHealth(saved) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
