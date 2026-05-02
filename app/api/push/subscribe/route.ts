import { NextResponse } from "next/server";
import { sql, DEMO_CREATOR_ID } from "@/lib/db";

export const dynamic = "force-dynamic";

type SubscribeBody = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function POST(req: Request) {
  const body = (await req.json()) as SubscribeBody;
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return NextResponse.json(
      { error: "missing endpoint or keys" },
      { status: 400 },
    );
  }

  await sql`
    INSERT INTO push_subscriptions (creator_id, endpoint, p256dh, auth)
    VALUES (${DEMO_CREATOR_ID}, ${body.endpoint}, ${body.keys.p256dh}, ${body.keys.auth})
    ON CONFLICT (endpoint) DO UPDATE
      SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
  `;

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (!body.endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }
  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${body.endpoint}`;
  return NextResponse.json({ ok: true });
}
