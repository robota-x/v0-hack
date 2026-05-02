import { NextResponse } from "next/server";
import { getSql, DEMO_CREATOR_ID } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, status, step, error, started_at, completed_at
    FROM workflow_runs
    WHERE creator_id = ${DEMO_CREATOR_ID}
    ORDER BY started_at DESC
    LIMIT 1
  `) as unknown as Array<{
    id: number;
    status: string;
    step: string | null;
    error: string | null;
    started_at: string;
    completed_at: string | null;
  }>;

  return NextResponse.json({ run: rows[0] ?? null });
}
