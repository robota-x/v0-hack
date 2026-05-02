# BrightData — Instagram Scrapers

Source: https://docs.brightdata.com/datasets/scrapers/instagram/introduction
Note: live docs confirmed Profile, Posts, Reels, Comments; Hashtag + Discover from training data (verify in dashboard).

## Overview

BrightData provides Instagram data through **real-time on-demand Scraper APIs**. You POST a scrape job, BrightData handles proxy rotation, anti-bot bypassing, and parsing. Results come back as structured JSON.

Two call modes:
- **Async** (`/trigger`): submit job → get `snapshot_id` → poll or receive webhook → download data. Up to 5,000 URLs per job.
- **Sync** (`/scrape`): blocks, returns data inline. Up to 20 URLs. ~10–30s. Use only for prototyping.

For our pipeline, always use **async + webhook**.

## Authentication

```http
Authorization: Bearer <BRIGHTDATA_API_TOKEN>
```

Token from BrightData dashboard → API settings.

## Available Scrapers

### 1. Profile Scraper
Scrapes a public Instagram profile by username or profile URL.

**Input**: `{ "url": "https://www.instagram.com/username/" }`

**Key output fields**:
```json
{
  "username": "natgeo",
  "full_name": "National Geographic",
  "biography": "...",
  "external_url": "https://...",
  "followers_count": 280500000,
  "following_count": 170,
  "posts_count": 27843,
  "is_verified": true,
  "is_business_account": true,
  "business_category": "Publisher",
  "profile_pic_url": "https://...",
  "id": "787132",
  "recent_posts": [
    {
      "shortcode": "C6mXYZabcDE",
      "display_url": "...",
      "likes_count": 42100,
      "comments_count": 310,
      "timestamp": "2025-04-30T10:00:00.000Z",
      "is_video": false
    }
  ]
}
```

**Use case**: Track creator's follower growth, post cadence, bio link changes. Run daily.

### 2. Post Scraper
Scrapes a single post by URL (shortcode).

**Input**: `{ "url": "https://www.instagram.com/p/SHORTCODE/" }`

**Key output fields**:
```json
{
  "shortcode": "CzX1abc23DE",
  "caption": "Morning routine hits different 🔥 #gymtok",
  "hashtags": ["gymtok", "fitness"],
  "mentions": [],
  "likes_count": 184200,
  "comments_count": 1103,
  "video_view_count": 2410000,
  "video_play_count": 2600000,
  "timestamp": "2025-04-28T14:22:00.000Z",
  "is_video": true,
  "product_type": "clips",
  "owner": { "username": "fitcoach_mike", "id": "1234567890" }
}
```

**Use case**: Deep dive on a specific viral post — what made it perform.

### 3. Reels Scraper
Scrapes Reels from a profile's `/reels/` page. Same fields as Post Scraper plus audio metadata.

**Input**: `{ "url": "https://www.instagram.com/username/reels/" }`

**Extra fields**:
```json
{
  "video_duration": 30,
  "music_info": {
    "audio_id": "1234567890",
    "audio_title": "original sound",
    "artist_name": "fitcoach_mike",
    "is_original_audio": true,
    "uses_count": 48200
  }
}
```

**Use case**: Track what audio is trending on a niche. `uses_count` delta between scrape runs = trending sound signal.

### 4. Comments Scraper
Confirmed in live docs. Scrapes comments on a post.

**Key output fields**: comment text, likes, replies, commenter username.

### 5. Hashtag Scraper *(verify in dashboard)*
Scrapes top + recent posts for a hashtag.

**Input**: `{ "hashtag": "gymtok" }` or `{ "url": "https://www.instagram.com/explore/tags/gymtok/" }`

**Key output fields**:
```json
{
  "hashtag": "gymtok",
  "media_count": 4821003,
  "top_posts": [
    {
      "shortcode": "CzX1abc23DE",
      "url": "https://www.instagram.com/p/CzX1abc23DE/",
      "is_video": true,
      "product_type": "clips",
      "likes_count": 184200,
      "video_view_count": 2410000,
      "timestamp": "2025-04-28T14:22:00.000Z",
      "owner": { "username": "fitcoach_mike" },
      "hashtags": ["gymtok", "fitness"]
    }
  ],
  "recent_posts": [...]
}
```

Typically returns 9 top + 48–100 recent posts. `limit` and `cursor` params for pagination.

**Use case**: Core trend discovery. Monitor 5–10 niche hashtags every 4h. Sort by `video_view_count / post_age_hours` to surface velocity.

### 6. Discover/Explore Scraper *(verify in dashboard — experimental)*
Scrapes Instagram Explore page for a topic/keyword.

**Input**: keyword or topic URL.

**Note**: Less reliable — Explore is login-personalized. Treat as supplementary, not primary signal.

## API Interface

### Async trigger (recommended)

```http
POST https://api.brightdata.com/datasets/v3/trigger
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "collector": "instagram_hashtag",
  "inputs": [
    { "hashtag": "gymtok" },
    { "hashtag": "fitnessmotivation" }
  ],
  "limit_per_input": 50,
  "notify": "https://your-app.com/hooks/brightdata"
}
```

Response (202):
```json
{ "snapshot_id": "s_abc123xyz", "status": "running" }
```

### Poll for readiness

```http
GET https://api.brightdata.com/datasets/v3/snapshot/s_abc123xyz
Authorization: Bearer <TOKEN>
```

Returns `{ "status": "ready", "records": 50 }` when done.

### Download results

```http
GET https://api.brightdata.com/datasets/v3/snapshot/s_abc123xyz?format=json
Authorization: Bearer <TOKEN>
```

Formats: `json`, `ndjson`, `csv`. Default is NDJSON — always request `?format=json` explicitly.

### Sync (prototype only)

```http
POST https://api.brightdata.com/datasets/v3/scrape?dataset_id=<DATASET_ID>
Authorization: Bearer <TOKEN>
Content-Type: application/json

[{ "url": "https://www.instagram.com/instagram" }]
```

Max 20 URLs. Times out at ~30s. Not for production.

### Webhook push (preferred for Vercel Workflows)

Set `"notify": "https://your-vercel-app.vercel.app/api/hooks/brightdata"` in the trigger body. BrightData POSTs the snapshot status when ready; you then download the data.

In Vercel Workflows: use a **hook** to receive the webhook and resume the workflow:

```typescript
const bdHook = defineHook<{ snapshotId: string }>();

// inside step:
await triggerBrightData(hashtags, webhookUrl); // POST to /trigger with notify=webhookUrl

// inside workflow after step:
for await (const { snapshotId } of bdHook.create({ token: jobId })) {
  const data = await downloadSnapshot(snapshotId);
  break;
}

// in POST /api/hooks/brightdata:
await bdHook.resume(jobId, { snapshotId: body.snapshot_id });
```

## Delivery Options

Beyond webhook/polling: S3, Snowflake, Azure Blob, Google Cloud Storage (for dataset/batch mode).

## Gotchas

| Area | Detail |
|---|---|
| **Private accounts** | Return only public header (name, bio, follower count) — no posts. No workaround. |
| **Async latency** | 30s–5 min for profile; 2–15 min for hashtag feed. Always async + webhook in production. |
| **Data freshness** | Point-in-time snapshot at scrape time. No streaming. |
| **Hashtag caps** | 9 top + 48–100 recent posts per call. Paginate for more. |
| **Discover stability** | Explore page is login-personalized and layout-changes frequently. Best-effort only. |
| **Audio data** | `music_info.uses_count` can be null if audio is unlicensed/removed. |
| **Cost** | Billed per successful record (CPM). Check dashboard for current credit rates. |
| **TOS** | Instagram ToS prohibits scraping. BrightData argues public data is lawful. Don't expose raw scraped data or store PII longer than needed. |
| **Collector IDs** | The `"collector"` field value may be account-specific slugs or UUIDs. Verify exact values in BrightData dashboard. |

## Recommended Pipeline for This Project

```
Vercel Cron (every 4h)
    │
    ├─► POST /trigger (Hashtag Scraper) — niche hashtag list
    ├─► POST /trigger (Profile Scraper) — watched creator list (daily)
    └─► POST /trigger (Reels Scraper)   — creator /reels/ pages (daily)

BrightData webhook → POST /api/hooks/brightdata
    │  resumes Vercel Workflow via hook
    ▼
Download snapshot → parse → delta analysis
    ├── new trending hashtag detected → trigger idea generation
    ├── audio uses_count spike → "trending sound" signal
    └── viral post in niche → "format inspiration" signal
```

## Key Scraper Selection for Our Use Case

| Goal | Best Scraper | Cadence |
|---|---|---|
| Monitor creator own profile | Profile Scraper | Daily |
| Discover trending hashtags | Hashtag Scraper | Every 4h |
| Find trending sounds/audio | Reels Scraper (on niche hashtag top posts) | Every 4h |
| Understand viral post anatomy | Post Scraper (on top shortcodes) | On-demand |
| Cross-topic breakout content | Discover Scraper | Supplementary |
