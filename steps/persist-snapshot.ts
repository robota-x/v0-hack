import { getSql, type SnapshotTheme } from '@/lib/db';
import type { RankedTheme } from '@/lib/types';

function appBaseUrl(): string {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
}

function toSnapshotThemes(rankedThemes: RankedTheme[]): SnapshotTheme[] {
  return [...rankedThemes]
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .map((t, i) => ({
      rank: i + 1,
      title: t.name,
      summary: t.description,
      source_count: t.evidence.length,
      why_it_matters: t.whyItMatters,
    }));
}

export async function persistSnapshot(input: {
  creatorId: number;
  rankedThemes: RankedTheme[];
  runId: number;
}): Promise<void> {
  'use step';

  const themes = toSnapshotThemes(input.rankedThemes);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.INTERNAL_API_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.INTERNAL_API_TOKEN}`;
  }

  const res = await fetch(`${appBaseUrl()}/api/snapshots`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ creator_id: input.creatorId, themes }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST /api/snapshots failed (${res.status}): ${text}`);
  }

  const { snapshot } = (await res.json()) as { snapshot: { id: number } };
  console.log(
    `[persistSnapshot] inserted snapshot id=${snapshot.id} for creatorId=${input.creatorId} with ${themes.length} themes`,
  );

  // Mark the workflow run as completed
  const sql = getSql();
  await sql`
    UPDATE workflow_runs
    SET status = 'completed', step = 'done', completed_at = NOW()
    WHERE id = ${input.runId}
  `;
}
