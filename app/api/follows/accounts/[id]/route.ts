import { NextResponse } from "next/server";
import { sql, DEMO_CREATOR_ID } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numeric = Number.parseInt(id, 10);
  if (!Number.isFinite(numeric)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await sql`
    DELETE FROM follow_accounts
    WHERE id = ${numeric} AND creator_id = ${DEMO_CREATOR_ID}
  `;
  return NextResponse.json({ ok: true });
}
