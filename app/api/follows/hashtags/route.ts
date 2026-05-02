import { NextResponse } from "next/server";
import { getSql, DEMO_CREATOR_ID, type FollowHashtag } from "@/lib/db";
import { normalizeHashtag } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sql = getSql();
  const body = (await req.json()) as { tag?: string };
  const tag = normalizeHashtag(body.tag ?? "");
  if (!tag) {
    return NextResponse.json({ error: "tag required" }, { status: 400 });
  }
  if (!/^[a-z0-9_]{1,80}$/.test(tag)) {
    return NextResponse.json({ error: "invalid hashtag" }, { status: 400 });
  }

  const rows = (await sql`
    INSERT INTO follow_hashtags (creator_id, tag)
    VALUES (${DEMO_CREATOR_ID}, ${tag})
    ON CONFLICT (creator_id, tag) DO UPDATE SET tag = EXCLUDED.tag
    RETURNING id, creator_id, tag, created_at
  `) as FollowHashtag[];

  return NextResponse.json(rows[0], { status: 201 });
}
