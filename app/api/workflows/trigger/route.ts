import { NextResponse } from "next/server";
import { sql, DEMO_CREATOR_ID } from "@/lib/db";

export const dynamic = "force-dynamic";

// Manually triggers the creator workflow for the demo creator.
// The actual workflow lives in app/workflows/creator-workflow.ts (not built yet).
// For now this just records a workflow_run row so the UI can show "queued" state,
// and (when implemented) the workflow runner will pick it up or be invoked here directly.
export async function POST() {
  const rows = (await sql`
    INSERT INTO workflow_runs (creator_id, status, step)
    VALUES (${DEMO_CREATOR_ID}, 'queued', 'fetchCreatorData')
    RETURNING id, creator_id, status, step, started_at
  `) as Array<{
    id: number;
    creator_id: number;
    status: string;
    step: string;
    started_at: string;
  }>;

  // TODO: when creator-workflow is wired, dispatch it here.
  // e.g. await trigger("creator-workflow", { creatorId: DEMO_CREATOR_ID, runId: rows[0].id });

  return NextResponse.json({ run: rows[0] }, { status: 202 });
}
