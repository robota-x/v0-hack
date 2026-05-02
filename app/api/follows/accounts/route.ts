import { NextResponse } from "next/server";
import { sql, DEMO_CREATOR_ID, type FollowAccount } from "@/lib/db";
import { normalizeUsername } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { username?: string };
  const username = normalizeUsername(body.username ?? "");
  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }
  if (!/^[a-z0-9._]{1,30}$/.test(username)) {
    return NextResponse.json(
      { error: "invalid Instagram handle" },
      { status: 400 },
    );
  }

  const rows = (await sql`
    INSERT INTO follow_accounts (creator_id, username)
    VALUES (${DEMO_CREATOR_ID}, ${username})
    ON CONFLICT (creator_id, username) DO UPDATE SET username = EXCLUDED.username
    RETURNING id, creator_id, username, created_at
  `) as FollowAccount[];

  return NextResponse.json(rows[0], { status: 201 });
}
