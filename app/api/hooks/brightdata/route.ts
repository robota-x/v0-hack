import { bdHook } from '@/lib/brightdata-hook';

// Called by BrightData when an async scrape snapshot is ready.
// Resumes the workflow step that is paused waiting on this snapshot_id.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const snapshotId: string = body?.snapshot_id ?? 'unknown';

  console.log('[brightdata-hook] received webhook for snapshot_id:', snapshotId);

  try {
    await bdHook.resume(`bd:${snapshotId}`, { snapshotId });
  } catch {
    // No workflow is currently waiting on this snapshot (e.g. stale or duplicate webhook)
    console.warn('[brightdata-hook] no workflow waiting for snapshot:', snapshotId);
  }

  return Response.json({ ok: true });
}
