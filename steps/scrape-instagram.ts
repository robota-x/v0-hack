import type { FollowList, RawScrapedData } from '@/lib/types';

export async function scrapeInstagram(followList: FollowList): Promise<RawScrapedData> {
  'use step';

  // TODO: replace with BrightData async trigger + webhook resume
  // const jobs = await Promise.all([
  //   ...followList.accounts.map(u => brightdata.trigger('instagram_profile', [{ url: `https://instagram.com/${u}/` }])),
  //   ...followList.hashtags.map(h => brightdata.trigger('instagram_hashtag', [{ hashtag: h }])),
  // ]);
  // then: createHook per snapshot_id, await BrightData webhook, download results
  console.log(
    `[scrapeInstagram] TODO: trigger BrightData for ${followList.accounts.length} accounts ` +
    `(${followList.accounts.join(', ')}) + ${followList.hashtags.length} hashtags ` +
    `(${followList.hashtags.map(h => '#' + h).join(', ')})`
  );

  return {
    profiles: [
      {
        username: 'fitness_with_mike',
        followersCount: 842_000,
        postsCount: 1203,
        recentPosts: [
          {
            shortcode: 'mock_abc123',
            caption: 'No excuses, just results 💪 #gymtok #morningroutine',
            likesCount: 24_300,
            videoViewCount: 310_000,
            isVideo: true,
            ownerUsername: 'fitness_with_mike',
            timestamp: '2025-05-01T06:00:00.000Z',
          },
        ],
      },
      {
        username: 'gymshark',
        followersCount: 7_200_000,
        postsCount: 4801,
        recentPosts: [
          {
            shortcode: 'mock_def456',
            caption: 'Push harder than yesterday 🔥 #gymshark #gains',
            likesCount: 98_400,
            videoViewCount: 1_240_000,
            isVideo: true,
            ownerUsername: 'gymshark',
            timestamp: '2025-05-01T09:00:00.000Z',
          },
        ],
      },
    ],
    hashtagFeeds: [
      {
        hashtag: 'gymtok',
        mediaCount: 4_821_003,
        topPosts: [
          {
            shortcode: 'mock_ght789',
            caption: 'Morning routine hits different at 5am 🌅 #gymtok #morningroutine',
            likesCount: 184_200,
            videoViewCount: 2_410_000,
            isVideo: true,
            ownerUsername: 'fitcoach_sarah',
            timestamp: '2025-04-30T05:00:00.000Z',
          },
          {
            shortcode: 'mock_jkl012',
            caption: 'POV: you actually showed up today 💯 #gymtok #consistency',
            likesCount: 91_000,
            videoViewCount: 1_100_000,
            isVideo: true,
            ownerUsername: 'iron_discipline',
            timestamp: '2025-04-30T18:00:00.000Z',
          },
        ],
      },
      {
        hashtag: 'morningroutine',
        mediaCount: 2_103_440,
        topPosts: [
          {
            shortcode: 'mock_mno345',
            caption: '5am routine that changed my life ✨ #morningroutine #gymtok',
            likesCount: 212_000,
            videoViewCount: 3_100_000,
            isVideo: true,
            ownerUsername: 'dailygainz',
            timestamp: '2025-04-29T05:30:00.000Z',
          },
        ],
      },
    ],
  };
}
