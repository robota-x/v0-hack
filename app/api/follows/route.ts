import { NextResponse } from "next/server";
import {
  sql,
  DEMO_CREATOR_ID,
  type FollowAccount,
  type FollowHashtag,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const accounts = (await sql`
    SELECT id, creator_id, username, created_at
    FROM follow_accounts
    WHERE creator_id = ${DEMO_CREATOR_ID}
    ORDER BY created_at DESC
  `) as FollowAccount[];

  const hashtags = (await sql`
    SELECT id, creator_id, tag, created_at
    FROM follow_hashtags
    WHERE creator_id = ${DEMO_CREATOR_ID}
    ORDER BY created_at DESC
  `) as FollowHashtag[];

  return NextResponse.json({ accounts, hashtags });
}
