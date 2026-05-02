import { generateWithClaude } from '@/lib/ai';
import type { RawScrapedData, Theme } from '@/lib/types';
import { z } from 'zod';

const SYSTEM_PROMPT = `You are a social media trend analyst. Your job is to extract dominant themes and patterns from Instagram data.

A theme is a cohesive pattern across multiple posts — not just a single topic, but a format, angle, messaging style, or cultural moment that's surfacing repeatedly.

Return your analysis as a JSON object with a "themes" array. Each theme must have:
- name (short, 3-5 words)
- description (1-2 sentences explaining the pattern)
- evidence (array of 2-4 human-readable pointers to supporting data, e.g., "3 of 5 top #gymtok posts reference morning routines")
- strength ("high" if 50%+ of data supports it, "medium" if 25-50%, "low" if 10-25%)`;

const themeSchema = z.object({
  name: z.string(),
  description: z.string(),
  evidence: z.array(z.string()),
  strength: z.enum(['high', 'medium', 'low']),
});

const outputSchema = z.object({
  themes: z.array(themeSchema),
});

export async function distilThemes(rawData: RawScrapedData): Promise<Theme[]> {
  'use step';

  const allPosts = [
    ...rawData.profiles.flatMap((p) => p.recentPosts),
    ...rawData.hashtagFeeds.flatMap((h) => h.topPosts),
  ];

  console.log(
    `[distilThemes] calling Claude with ${allPosts.length} posts across ` +
      `${rawData.profiles.length} profiles and ${rawData.hashtagFeeds.length} hashtag feeds`,
  );

  // Truncate captions to stay within token budget (each caption can be 2200 chars)
  const compactData = {
    profiles: rawData.profiles.map((p) => ({
      username: p.username,
      followersCount: p.followersCount,
      postsCount: p.postsCount,
      recentPosts: p.recentPosts.slice(0, 10).map((post) => ({
        caption: post.caption.slice(0, 300),
        likesCount: post.likesCount,
        videoViewCount: post.videoViewCount,
        isVideo: post.isVideo,
      })),
    })),
    hashtagFeeds: rawData.hashtagFeeds.map((h) => ({
      hashtag: h.hashtag,
      mediaCount: h.mediaCount,
      topPosts: h.topPosts.slice(0, 10).map((post) => ({
        caption: post.caption.slice(0, 300),
        likesCount: post.likesCount,
        videoViewCount: post.videoViewCount,
        isVideo: post.isVideo,
        ownerUsername: post.ownerUsername,
      })),
    })),
  };

  const prompt = `Analyze this Instagram data snapshot and extract 3-5 dominant themes:\n\n${JSON.stringify(compactData, null, 2)}`;

  const output = await generateWithClaude({
    system: SYSTEM_PROMPT,
    prompt,
    schema: outputSchema,
  });

  console.log(`[distilThemes] extracted ${output.themes.length} themes`);
  return output.themes;
}
