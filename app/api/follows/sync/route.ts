import { NextResponse } from "next/server";
import { getSql, DEMO_CREATOR_ID } from "@/lib/db";
import { normalizeHashtag, normalizeUsername } from "@/lib/utils";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-z0-9._]{1,30}$/;
const TAG_RE = /^[a-z0-9_]{1,80}$/;

/**
 * Replaces the demo creator's follow_accounts and follow_hashtags with the
 * given lists (used when onboarding finishes or re-runs).
 */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    accounts?: unknown;
    hashtags?: unknown;
  };

  const rawAccounts = Array.isArray(body.accounts) ? body.accounts : [];
  const rawHashtags = Array.isArray(body.hashtags) ? body.hashtags : [];

  const accounts = [
    ...new Set(
      rawAccounts
        .map((u) => normalizeUsername(String(u ?? "")))
        .filter(Boolean),
    ),
  ];

  const hashtags = [
    ...new Set(
      rawHashtags
        .map((t) => normalizeHashtag(String(t ?? "")))
        .filter(Boolean),
    ),
  ];

  const badUser = accounts.find((u) => !USERNAME_RE.test(u));
  if (badUser) {
    return NextResponse.json(
      { error: `invalid Instagram handle: ${badUser}` },
      { status: 400 },
    );
  }
  const badTag = hashtags.find((t) => !TAG_RE.test(t));
  if (badTag) {
    return NextResponse.json(
      { error: `invalid hashtag: ${badTag}` },
      { status: 400 },
    );
  }

  const sql = getSql();

  await sql`DELETE FROM follow_accounts WHERE creator_id = ${DEMO_CREATOR_ID}`;
  await sql`DELETE FROM follow_hashtags WHERE creator_id = ${DEMO_CREATOR_ID}`;

  for (const username of accounts) {
    await sql`
      INSERT INTO follow_accounts (creator_id, username)
      VALUES (${DEMO_CREATOR_ID}, ${username})
    `;
  }
  for (const tag of hashtags) {
    await sql`
      INSERT INTO follow_hashtags (creator_id, tag)
      VALUES (${DEMO_CREATOR_ID}, ${tag})
    `;
  }

  return NextResponse.json(
    { accounts: accounts.length, hashtags: hashtags.length },
    { status: 200 },
  );
}
