import type { RawScrapedData, Theme } from '@/lib/types';

export async function distilThemes(rawData: RawScrapedData): Promise<Theme[]> {
  'use step';

  const allPosts = [
    ...rawData.profiles.flatMap(p => p.recentPosts),
    ...rawData.hashtagFeeds.flatMap(h => h.topPosts),
  ];

  // TODO: replace with Claude API call
  // const response = await anthropic.messages.create({
  //   model: 'claude-sonnet-4-6',
  //   system: 'You are a social media analyst. Extract dominant themes from this Instagram data snapshot.',
  //   messages: [{ role: 'user', content: JSON.stringify(rawData) }],
  // });
  console.log(
    `[distilThemes] TODO: call Claude API with ${allPosts.length} posts across ` +
    `${rawData.profiles.length} profiles and ${rawData.hashtagFeeds.length} hashtag feeds`
  );

  return [
    {
      name: 'Early Morning Workout Culture',
      description:
        '5am/6am gym content is dominating feeds — high-performing videos frame the early session as identity-defining, not just exercise.',
      evidence: [
        '#morningroutine top post: 3.1M views (@dailygainz)',
        '#gymtok: 2 of 2 top posts reference morning sessions',
        '@fitness_with_mike recent reel: 310K views on morning routine',
      ],
      strength: 'high',
    },
    {
      name: 'Consistency Over Motivation Messaging',
      description:
        'POV-style and direct-address videos about showing up despite not feeling like it are outperforming hype content.',
      evidence: [
        '"POV: you actually showed up today" — 1.1M views (#gymtok)',
        '@gymshark "Push harder than yesterday" — 1.24M views',
      ],
      strength: 'high',
    },
    {
      name: 'Transformation Proof Content',
      description:
        'Before/after and progress-tracking formats generate strong saves and shares across fitness hashtags.',
      evidence: [
        '#gains top posts skew toward body transformation clips',
      ],
      strength: 'medium',
    },
  ];
}
