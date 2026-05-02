// BrightData webhook receiver — called by BrightData when an async scrape snapshot is ready.
// Resumes the paused workflow via a hook token matching the snapshot_id.
//
// TODO (when wiring real BrightData):
//   import { resumeHook } from 'workflow/api';
//   await resumeHook(`bd:${snapshotId}`, { data: downloadedData });

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const snapshotId = body?.snapshot_id ?? 'unknown';

  console.log('[brightdata-hook] received webhook for snapshot_id:', snapshotId);

  return Response.json({ ok: true });
}
