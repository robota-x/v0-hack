// ─── Follow list (user-managed CRUD) ────────────────────────────────────────

export interface FollowList {
  accounts: string[]; // Instagram usernames, no @
  hashtags: string[]; // without #
}

// ─── Creator profile ─────────────────────────────────────────────────────────

export interface CreatorProfile {
  interests: string[];
  style: string;
  niche: string;
}

// ─── Step 1 output ───────────────────────────────────────────────────────────

export interface CreatorData {
  creatorId: string;
  followList: FollowList;
  profile: CreatorProfile;
}

// ─── Step 2 output (raw BrightData) ──────────────────────────────────────────

export interface RawPost {
  shortcode: string;
  caption: string;
  likesCount: number;
  videoViewCount: number;
  isVideo: boolean;
  ownerUsername: string;
  timestamp: string; // ISO 8601
}

export interface RawProfile {
  username: string;
  followersCount: number;
  postsCount: number;
  recentPosts: RawPost[];
}

export interface RawHashtagFeed {
  hashtag: string;
  mediaCount: number;
  topPosts: RawPost[];
}

export interface RawScrapedData {
  profiles: RawProfile[];
  hashtagFeeds: RawHashtagFeed[];
}

// ─── Step 3 output (Claude distil) ───────────────────────────────────────────

export interface Theme {
  name: string;
  description: string;
  evidence: string[]; // human-readable pointers to supporting data
  strength: 'high' | 'medium' | 'low';
}

// ─── Step 4 output (Claude rank) ─────────────────────────────────────────────

export interface RankedTheme extends Theme {
  relevanceScore: number; // 0–100
  whyItMatters: string;
  whatToWatch: string;
}

// ─── Step 5a output (DB snapshot record) ─────────────────────────────────────

export interface Snapshot {
  creatorId: string;
  rankedThemes: RankedTheme[];
  generatedAt: string; // ISO 8601 — set inside persistSnapshot step
}
