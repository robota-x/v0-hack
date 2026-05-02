import type { CreatorProfile, RankedTheme, Theme } from '@/lib/types';

export async function rankAgainstProfile(
  themes: Theme[],
  profile: CreatorProfile
): Promise<RankedTheme[]> {
  'use step';

  // TODO: replace with Claude API call
  // const response = await anthropic.messages.create({
  //   model: 'claude-sonnet-4-6',
  //   system: `You are a content advisor for a creator. Profile: ${JSON.stringify(profile)}`,
  //   messages: [{ role: 'user', content: `Rank these themes by relevance: ${JSON.stringify(themes)}` }],
  // });
  console.log(
    `[rankAgainstProfile] TODO: call Claude API to rank ${themes.length} themes ` +
    `against profile niche="${profile.niche}"`
  );

  return [
    {
      ...themes[0],
      relevanceScore: 97,
      whyItMatters:
        'Morning routines are central to your niche and this format is peaking — your audience expects this content from you.',
      whatToWatch:
        '@dailygainz "5am routine" reel (3.1M views) and #morningroutine top posts for format reference.',
    },
    {
      ...themes[1],
      relevanceScore: 91,
      whyItMatters:
        'Your style is motivational — consistency messaging resonates with your existing audience and is validated by top performers in your hashtags.',
      whatToWatch:
        '#gymtok "POV: you actually showed up" format (1.1M views) — direct address, 15s, no music intro.',
    },
    {
      ...themes[2],
      relevanceScore: 74,
      whyItMatters:
        'Transformation content performs well for saves; relevant if you have before/after material to share.',
      whatToWatch: '#gains top posts for editing style and caption structure.',
    },
  ];
}
