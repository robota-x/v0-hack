import { generateWithClaude } from '@/lib/ai';
import type { Theme, RankedTheme, CreatorProfile } from '@/lib/types';
import { z } from 'zod';

const SYSTEM_PROMPT = `You are a content strategist helping creators identify which trends matter most to them.

Your job: rank themes by relevance to a specific creator's profile (niche, interests, style). For each theme, add:
- relevanceScore (0-100, where 100 = perfect fit for their niche and audience)
- whyItMatters (1 sentence: why this theme is relevant to their specific niche and goals)
- whatToWatch (1 sentence: what specific signals or accounts they should monitor)

Return your analysis as a JSON object with a "rankedThemes" array, sorted by relevanceScore descending.`;

const rankedThemeSchema = z.object({
  name: z.string(),
  description: z.string(),
  evidence: z.array(z.string()),
  strength: z.enum(['high', 'medium', 'low']),
  relevanceScore: z.number().min(0).max(100),
  whyItMatters: z.string(),
  whatToWatch: z.string(),
});

const outputSchema = z.object({
  rankedThemes: z.array(rankedThemeSchema),
});

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

  const output = await generateWithClaude({
    system: SYSTEM_PROMPT,
    prompt,
    schema: outputSchema,
  });

  console.log(
    `[rankAgainstProfile] ranked ${output.rankedThemes.length} themes, top score: ${output.rankedThemes[0]?.relevanceScore ?? 'N/A'}`,
  );

  return output.rankedThemes.sort((a, b) => b.relevanceScore - a.relevanceScore);
}
