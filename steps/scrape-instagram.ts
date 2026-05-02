import type { FollowList, RawProfile, RawHashtagFeed, RawPost } from '@/lib/types';
import { triggerScrape, downloadSnapshot } from '@/lib/brightdata';

// BrightData API response shapes (snake_case)
interface BdPost {
  shortcode?: string;
  caption?: string;
  likes_count?: number;
  video_view_count?: number;
  is_video?: boolean;
  owner?: { username?: string };
  timestamp?: string;
}

interface BdProfile {
  username?: string;
  followers_count?: number;
  posts_count?: number;
  recent_posts?: BdPost[];
}

interface BdHashtagFeed {
  hashtag?: string;
  media_count?: number;
  top_posts?: BdPost[];
}

function mapPost(p: BdPost): RawPost {
  return {
    shortcode: p.shortcode ?? '',
    caption: p.caption ?? '',
    likesCount: p.likes_count ?? 0,
    videoViewCount: p.video_view_count ?? 0,
    isVideo: p.is_video ?? false,
    ownerUsername: p.owner?.username ?? '',
    timestamp: p.timestamp ?? new Date().toISOString(),
  };
}

function appBaseUrl(): string {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
}

export async function triggerInstagramScrapes(
  followList: FollowList,
): Promise<{ profileSnapshotId: string; hashtagSnapshotId: string }> {
  'use step';

  const notifyUrl = `${appBaseUrl()}/api/hooks/brightdata`;

  console.log(
    `[triggerInstagramScrapes] firing BrightData for ${followList.accounts.length} profiles ` +
      `(${followList.accounts.join(', ')}) + ${followList.hashtags.length} hashtags ` +
      `(${followList.hashtags.map((h) => '#' + h).join(', ')}) — notify: ${notifyUrl}`,
  );

  const [profileSnapshotId, hashtagSnapshotId] = await Promise.all([
    triggerScrape({
      collector: 'instagram_profile',
      inputs: followList.accounts.map((u) => ({
        url: `https://www.instagram.com/${u}/`,
      })),
      notifyUrl,
    }),
    triggerScrape({
      collector: 'instagram_hashtag',
      inputs: followList.hashtags.map((h) => ({ hashtag: h })),
      limitPerInput: 50,
      notifyUrl,
    }),
  ]);

  console.log(
    `[triggerInstagramScrapes] triggered — profileSnapshotId=${profileSnapshotId} hashtagSnapshotId=${hashtagSnapshotId}`,
  );

  return { profileSnapshotId, hashtagSnapshotId };
}

export async function downloadInstagramProfiles(snapshotId: string): Promise<RawProfile[]> {
  'use step';

  console.log(`[downloadInstagramProfiles] downloading snapshot=${snapshotId}`);
  const raw = await downloadSnapshot<BdProfile>(snapshotId);

  return raw.map((p) => ({
    username: p.username ?? '',
    followersCount: p.followers_count ?? 0,
    postsCount: p.posts_count ?? 0,
    recentPosts: (p.recent_posts ?? []).map(mapPost),
  }));
}

export async function downloadInstagramHashtags(snapshotId: string): Promise<RawHashtagFeed[]> {
  'use step';

  console.log(`[downloadInstagramHashtags] downloading snapshot=${snapshotId}`);
  const raw = await downloadSnapshot<BdHashtagFeed>(snapshotId);

  return raw.map((f) => ({
    hashtag: f.hashtag ?? '',
    mediaCount: f.media_count ?? 0,
    topPosts: (f.top_posts ?? []).map(mapPost),
  }));
}
