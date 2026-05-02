# BrightData — TikTok Scrapers

Source: https://docs.brightdata.com/datasets/scrapers/tiktok/introduction
Note: live docs confirmed Profile, Posts, TikTok Shop, Comments, Posts by Profile Fast API. No native trending/hashtag scrapers visible in docs as of research date.

## Overview

BrightData's TikTok scraper suite shares the same REST API interface as the Instagram scrapers. Same auth model, same async/sync pattern, same webhook delivery.

**Key finding**: TikTok's live docs do **not** expose a native "trending hashtags" or "trending sounds" scraper — the product is more oriented toward profile and post data. This is the primary reason Instagram is our first-choice platform for trend discovery.

TikTok is a strong fallback or complement if Instagram's Explore/Hashtag scrapers prove unreliable.

## Authentication

Same as Instagram:
```http
Authorization: Bearer <BRIGHTDATA_API_TOKEN>
```

## Available Scrapers

### 1. Profile Scraper
Scrapes a TikTok profile by username or profile URL.

**Input**: `{ "url": "https://www.tiktok.com/@username" }`

**Key output fields**:
```json
{
  "username": "fitcoach_mike",
  "nickname": "Mike | Fitness Coach",
  "bio": "...",
  "followers_count": 1200000,
  "following_count": 450,
  "likes_count": 8500000,
  "video_count": 312,
  "is_verified": false,
  "avatar_url": "https://..."
}
```

**Use case**: Monitor a creator's follower/likes growth over time. Run daily.

### 2. Posts Scraper
Scrapes individual TikTok posts by URL.

**Input**: `{ "url": "https://www.tiktok.com/@username/video/1234567890" }`

**Key output fields**:
```json
{
  "id": "1234567890",
  "description": "Morning routine 🔥 #gym #fyp",
  "hashtags": ["gym", "fyp"],
  "play_count": 4200000,
  "like_count": 320000,
  "comment_count": 4100,
  "share_count": 12000,
  "timestamp": "2025-04-28T14:22:00.000Z",
  "duration": 28,
  "video_url": "https://...",
  "cover_url": "https://...",
  "music": {
    "id": "987654321",
    "title": "original sound - fitcoach_mike",
    "author": "fitcoach_mike",
    "is_original": true
  },
  "author": { "username": "fitcoach_mike" }
}
```

**Use case**: Deep dive on a viral TikTok — hashtag set, music, engagement breakdown.

### 3. Posts by Profile Fast API
Quickly collects all (or recent N) posts from a specific profile.

**Input**: `{ "url": "https://www.tiktok.com/@username" }` with optional `limit`

**Use case**: Snapshot a creator's recent content catalog. Good for initial onboarding of a new creator.

### 4. Comments Scraper
Scrapes comments on a TikTok post.

**Key output fields**: comment text, likes, replies, commenter username.

### 5. TikTok Shop Scraper
Scrapes product listings from TikTok Shop.

**Not relevant for our use case** — skip for this project.

## API Interface

Identical interface to Instagram scrapers. Same base URL, same auth, same trigger/snapshot/download pattern.

### Async trigger

```http
POST https://api.brightdata.com/datasets/v3/trigger
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "collector": "tiktok_profile",
  "inputs": [
    { "url": "https://www.tiktok.com/@fitcoach_mike" }
  ],
  "notify": "https://your-app.com/hooks/brightdata"
}
```

### Sync (prototype only)

```http
POST https://api.brightdata.com/datasets/v3/scrape?dataset_id=<DATASET_ID>
Authorization: Bearer <TOKEN>
Content-Type: application/json

[{ "url": "https://www.tiktok.com/@username" }]
```

Max 20 URLs, ~10–30s, not for production.

## Comparison to Instagram

| Dimension | Instagram | TikTok |
|---|---|---|
| Trending hashtag scraper | Yes (Hashtag Scraper) | No native endpoint |
| Trending sounds/audio | Via Reels Scraper (`music_info.uses_count`) | Via Posts Scraper (`music.id`) but no uses_count |
| Profile data | Rich | Rich |
| Discovery/Explore | Yes (experimental, unstable) | No |
| Post engagement fields | Likes, comments, views, plays | Likes, comments, plays, shares |
| TikTok-specific | — | Music/sound metadata, share counts |
| Data accessibility | More restricted by Meta's anti-bot | Generally more accessible |

**Conclusion**: Instagram is richer for **trend discovery** (hashtags, explore). TikTok is complementary for **creator profile monitoring** and **sound/music tracking** (sounds spread cross-platform). Consider running both in parallel.

## Gotchas

| Area | Detail |
|---|---|
| **No trending endpoint** | BrightData doesn't expose a "trending hashtags" or "FYP trends" TikTok scraper. Must infer trends from post data. |
| **Sound tracking** | Can track a specific sound's spread by scraping posts with that `music.id`, but no global "trending sounds" feed. |
| **Async latency** | Similar to Instagram: 30s–5 min per job. |
| **Private accounts** | Same as Instagram — only public header returned. |
| **FYP personalization** | TikTok's "For You Page" is heavily personalized; no way to get a neutral trending feed via scraping. |
| **Cost** | Same per-record billing model as Instagram scrapers. |

## When to Use TikTok Instead of (or Alongside) Instagram

- **Creator is TikTok-primary**: Onboard with TikTok Profile + Posts by Profile.
- **Cross-platform trend validation**: A hashtag trending on Instagram + TikTok is a stronger signal than one platform alone.
- **Sound origin tracking**: Sounds often originate on TikTok before crossing to Instagram Reels. Scraping TikTok posts helps identify early-stage trending audio.
- **Instagram Hashtag Scraper is down/unreliable**: Fall back to TikTok Posts Scraper with inferred hashtag filtering.

## Recommended Usage for This Project

Start with Instagram as the primary trend discovery platform. Add TikTok for creator profile monitoring and as a cross-platform validation signal:

```
Daily runs:
  POST /trigger (TikTok Profile Scraper) — for TikTok-active creators
  POST /trigger (TikTok Posts by Profile) — snapshot recent content

Every 4h:
  [Instagram Hashtag Scraper — primary trend signal]

On viral post detection:
  POST /trigger (TikTok Posts Scraper) — on shortlisted posts for deep metadata
```
