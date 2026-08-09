import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppSession } from "@/lib/auth/session";
import {
  listEstimates,
  runEstimateWorkflow,
  saveEstimate,
  updateEstimateStatus,
} from "@/lib/estimating/estimates-store";
import {
  normalizeEstimateStatus,
  type EstimateWorkflowAction,
} from "@/lib/estimating/estimate-types";
import { WorkflowError } from "@/lib/estimating/workflow";
import type { PricedEstimate } from "@/lib/estimating/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statusEnum = z.enum([
  "draft",
  "for_estimate",
  "estimating",
  "sent",
  "review",
]);

async function requireSession() {
  const session = await getAppSession();
  if (!session?.isEmployee || !session.actorRole) return null;
  return session;
}

export async function GET(req: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const status = searchParams.get("status");
  let items = await listEstimates(limit);
  if (status) {
    const normalized = normalizeEstimateStatus(status);
    items = items.filter((e) => e.status === normalized);
  }
  return NextResponse.json({ estimates: items });
}

const saveSchema = z.object({
  id: z.string().optional(),
  customerName: z.string().optional(),
  productLabel: z.string().min(1),
  status: statusEnum.optional(),
  priced: z.custom<PricedEstimate>(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }
    const role = session.actorRole!;
    const body = saveSchema.parse(await req.json());
    const status = body.status
      ? normalizeEstimateStatus(body.status)
      : undefined;

    if (status === "sent" && role !== "ep") {
      return NextResponse.json(
        {
          error:
            "Only Estimating (E&P) can send to the customer. Use Send for estimate.",
        },
        { status: 403 }
      );
    }
    if (status === "estimating" && role !== "ep") {
      return NextResponse.json(
        { error: "Only Estimating (E&P) can claim quotes." },
        { status: 403 }
      );
    }

    const saved = await saveEstimate({
      id: body.id,
      customerName: body.customerName,
      productLabel: body.productLabel,
      status,
      priced: body.priced,
      actorRole: role,
    });
    return NextResponse.json({ estimate: saved });
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }
    const role = session.actorRole!;
    const raw = await req.json();

    if (raw.action) {
      const body = z
        .object({
          id: z.string(),
          action: z.enum(["submit", "claim", "release", "send", "reopen"]),
          actorName: z.string().optional(),
        })
        .parse(raw);

      const estimate = await runEstimateWorkflow(
        body.id,
        body.action as EstimateWorkflowAction,
        role,
        body.actorName ?? session.profile.full_name
      );
      return NextResponse.json({ estimate });
    }

    const body = z
      .object({
        id: z.string(),
        status: statusEnum,
      })
      .parse(raw);

    const estimate = await updateEstimateStatus(
      body.id,
      normalizeEstimateStatus(body.status),
      role
    );
    return NextResponse.json({ estimate });
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
