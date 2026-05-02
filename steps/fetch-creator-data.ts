import type { CreatorData } from '@/lib/types';

export async function fetchCreatorData(creatorId: string): Promise<CreatorData> {
  'use step';

  // TODO: replace with DB query
  // const row = await db.query('SELECT * FROM creator_profiles WHERE id = $1', [creatorId]);
  console.log(`[fetchCreatorData] TODO: query DB for creatorId=${creatorId}`);

  return {
    creatorId,
    followList: {
      accounts: ['theaiagents', 'alliekmiller', 'realtryhackme', 'indie_hackers'],
      hashtags: ['aiagents', 'llmops', 'agenticai', 'vibecoding'],
    },
    profile: {
      interests: ['AI agents', 'LLM engineering', 'cybersecurity', 'indie hacking'],
      style: 'technical deep-dives, builder updates, short-form explainers, demo clips',
      niche: 'agentic AI development and hacking',
    },
  };
}
