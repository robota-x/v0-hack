import { NextResponse } from "next/server";
import { sql, DEMO_CREATOR_ID, type Snapshot } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = (await sql`
    SELECT id, creator_id, themes, summary, created_at
    FROM snapshots
    WHERE creator_id = ${DEMO_CREATOR_ID}
    ORDER BY created_at DESC
    LIMIT 1
  `) as Snapshot[];

  return NextResponse.json({ snapshot: rows[0] ?? null });
}
