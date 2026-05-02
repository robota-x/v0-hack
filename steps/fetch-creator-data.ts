import type { CreatorData } from '@/lib/types';

export async function fetchCreatorData(creatorId: string): Promise<CreatorData> {
  'use step';

  // TODO: replace with DB query
  // const row = await db.query('SELECT * FROM creator_profiles WHERE id = $1', [creatorId]);
  console.log(`[fetchCreatorData] TODO: query DB for creatorId=${creatorId}`);

  return {
    creatorId,
    followList: {
      accounts: ['fitness_with_mike', 'gymshark', 'cbum'],
      hashtags: ['gymtok', 'morningroutine', 'fitnessmotivation', 'gains'],
    },
    profile: {
      interests: ['gym workouts', 'morning routines', 'nutrition', 'body transformation'],
      style: 'high-energy, motivational, short-form 15–30s reels, trending audio',
      niche: 'fitness and gym lifestyle',
    },
  };
}
