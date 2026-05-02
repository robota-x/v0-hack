import { NextResponse } from "next/server";
import { getSql, DEMO_CREATOR_ID, type Snapshot } from "@/lib/db";

export const dynamic = "force-dynamic";

// Used by the workflow's persistSnapshot step to write a new snapshot.
// Protected by INTERNAL_API_TOKEN — workflow passes it as Authorization: Bearer.
export async function POST(req: Request) {
  const sql = getSql();
  const expected = process.env.INTERNAL_API_TOKEN;
  if (expected) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const body = (await req.json()) as {
    creator_id?: number;
    themes: unknown;
    summary?: string | null;
  };

  const creatorId = body.creator_id ?? DEMO_CREATOR_ID;
  const themes = body.themes ?? [];
  const summary = body.summary ?? null;

  const rows = (await sql`
    INSERT INTO snapshots (creator_id, themes, summary)
    VALUES (${creatorId}, ${JSON.stringify(themes)}::jsonb, ${summary})
    RETURNING id, creator_id, themes, summary, created_at
  `) as Snapshot[];

  return NextResponse.json(rows[0], { status: 201 });
}
