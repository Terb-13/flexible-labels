import { NextResponse } from "next/server";
import {
  getRegisterSnapshot,
  registerHealth,
} from "@/lib/estimating/register-store";
import { estimateStats } from "@/lib/estimating/estimates-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getRegisterSnapshot();
  const health = registerHealth(snapshot);
  const stats = await estimateStats();
  return NextResponse.json({
    ok: health.loaded && health.plants === 1,
    register: health,
    estimates: stats,
    database: "json-file",
  });
}
