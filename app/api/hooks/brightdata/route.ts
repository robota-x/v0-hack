import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// BrightData "delivery" webhook — they POST when a snapshot is ready.
// The workflow itself will subscribe to this via Vercel Workflows' webhook step
// (see docs/vercel-workflows.md). This route acts as the public receiver and
// will be wired up once the workflow is implemented.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  console.log("[v0] brightdata webhook received:", body);

  // TODO: forward to active workflow run via workflow.send / event emitter.
  // For now we just ack so BrightData doesn't retry.
  return NextResponse.json({ received: true });
}
