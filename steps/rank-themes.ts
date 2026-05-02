import { generateWithClaude } from '@/lib/ai';
import type { Theme, RankedTheme, CreatorProfile } from '@/lib/types';

const SYSTEM_PROMPT = `You are a content strategist helping creators identify which trends matter most to them.

Your job: rank themes by relevance to a specific creator's profile (niche, interests, style). For each theme, add:
- relevanceScore (0-100, where 100 = perfect fit for their niche and audience)
- whyItMatters (1 sentence: why this theme is relevant to their specific niche and goals)
- whatToWatch (1 sentence: what specific signals or accounts they should monitor)

Return ONLY a JSON array of ranked themes (sorted by relevanceScore descending), no markdown, no explanation.`;

export async function rankAgainstProfile(
  themes: Theme[],
  profile: CreatorProfile,
): Promise<RankedTheme[]> {
  'use step';

  console.log(
    `[rankAgainstProfile] calling Claude to rank ${themes.length} themes against niche="${profile.niche}"`,
  );

  const prompt = `Creator profile:
- Niche: ${profile.niche}
- Interests: ${profile.interests.join(', ')}
- Style: ${profile.style}

Themes to rank:
${JSON.stringify(themes, null, 2)}

Rank these themes by relevance to this creator. Return the full theme objects with relevanceScore, whyItMatters, and whatToWatch added.`;

  const responseText = await generateWithClaude({
    system: SYSTEM_PROMPT,
    prompt,
  });

  try {
    const ranked = JSON.parse(responseText) as RankedTheme[];
    console.log(
      `[rankAgainstProfile] ranked ${ranked.length} themes, top score: ${ranked[0]?.relevanceScore ?? 'N/A'}`,
    );
    return ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);
  } catch (err) {
    console.error('[rankAgainstProfile] failed to parse Claude response:', responseText);
    throw new Error(`Claude response parsing failed: ${err}`);
  }
}
