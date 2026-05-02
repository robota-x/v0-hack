import { NextResponse } from "next/server";
import { getSql, DEMO_CREATOR_ID, type Creator } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, name, niche, interests, style, onboarded, created_at, updated_at
    FROM creators
    WHERE id = ${DEMO_CREATOR_ID}
    LIMIT 1
  `) as unknown as Creator[];

  if (!rows[0]) {
    return NextResponse.json({ error: "creator not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: Request) {
  const sql = getSql();
  const body = (await req.json()) as Partial<{
    name: string;
    niche: string;
    interests: string[];
    style: string;
    onboarded: boolean;
  }>;

  const name = body.name ?? null;
  const niche = body.niche ?? null;
  const interests = Array.isArray(body.interests) ? body.interests : null;
  const style = body.style ?? null;
  const onboarded = typeof body.onboarded === "boolean" ? body.onboarded : null;

  const rows = (await sql`
    UPDATE creators
    SET
      name = COALESCE(${name}, name),
      niche = COALESCE(${niche}, niche),
      interests = COALESCE(${interests}::text[], interests),
      style = COALESCE(${style}, style),
      onboarded = COALESCE(${onboarded}, onboarded),
      updated_at = NOW()
    WHERE id = ${DEMO_CREATOR_ID}
    RETURNING id, name, niche, interests, style, onboarded, created_at, updated_at
  `) as unknown as Creator[];

  return NextResponse.json(rows[0]);
}
