import { getSql, DEMO_CREATOR_ID } from "@/lib/db";
import { start } from "workflow/api";
import { creatorWorkflow } from "@/workflows/creator-workflow";

export const dynamic = "force-dynamic";

// Triggered by Vercel Cron (vercel.json: "0 */6 * * *")
// Also callable manually: GET /api/cron/run
export async function GET() {
  const sql = getSql();

  const rows = (await sql`
    INSERT INTO workflow_runs (creator_id, status, step)
    VALUES (${DEMO_CREATOR_ID}, 'queued', 'fetchCreatorData')
    RETURNING id, creator_id, status, step, started_at
  `) as Array<{ id: number; creator_id: number; status: string; step: string; started_at: string }>;

  const run = rows[0];

  await start(creatorWorkflow, [{ creatorId: DEMO_CREATOR_ID, runId: run.id }]);

  await sql`
    UPDATE workflow_runs SET status = 'running' WHERE id = ${run.id}
  `;

  return Response.json({ started: true, creatorId: DEMO_CREATOR_ID, runId: run.id });
}
