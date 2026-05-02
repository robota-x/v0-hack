import { start } from 'workflow/api';
import { creatorWorkflow } from '@/workflows/creator-workflow';

// Triggered by Vercel Cron (vercel.json: "0 */6 * * *")
// Also callable manually: GET /api/cron/run
// TODO: replace hardcoded ID with DB query for all subscribed creators
export async function GET() {
  const creatorId = 'mock-creator-001';
  const run = await start(creatorWorkflow, [{ creatorId }]);
  return Response.json({ started: true, creatorId, runId: run.runId });
}
