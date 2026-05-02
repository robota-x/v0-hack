import { getSql, type Creator, type FollowAccount, type FollowHashtag } from '@/lib/db';
import type { CreatorData } from '@/lib/types';

export async function fetchCreatorData(creatorId: number): Promise<CreatorData> {
  'use step';

  const sql = getSql();

  const [creatorRows, accountRows, hashtagRows] = await Promise.all([
    sql`SELECT * FROM creators WHERE id = ${creatorId}` as Promise<Creator[]>,
    sql`SELECT * FROM follow_accounts WHERE creator_id = ${creatorId} ORDER BY created_at DESC` as Promise<FollowAccount[]>,
    sql`SELECT * FROM follow_hashtags WHERE creator_id = ${creatorId} ORDER BY created_at DESC` as Promise<FollowHashtag[]>,
  ]);

  const creator = creatorRows[0];
  if (!creator) throw new Error(`Creator ${creatorId} not found`);

  return {
    creatorId,
    followList: {
      accounts: accountRows.map((r) => r.username),
      hashtags: hashtagRows.map((r) => r.tag),
    },
    profile: {
      interests: creator.interests ?? [],
      style: creator.style ?? '',
      niche: creator.niche ?? '',
    },
  };
}
