import type { RankedTheme } from '@/lib/types';

export async function persistSnapshot(input: {
  creatorId: string;
  rankedThemes: RankedTheme[];
}): Promise<void> {
  'use step';

  // generatedAt is set here (inside a step) to respect the workflow determinism rule
  const generatedAt = new Date().toISOString();

  // TODO: replace with Neon DB insert
  // await db.query(
  //   'INSERT INTO snapshots (creator_id, ranked_themes, generated_at) VALUES ($1, $2, $3)',
  //   [input.creatorId, JSON.stringify(input.rankedThemes), generatedAt]
  // );
  console.log(
    `[persistSnapshot] TODO: INSERT snapshot for creatorId=${input.creatorId} ` +
    `with ${input.rankedThemes.length} themes at ${generatedAt}`
  );
}
