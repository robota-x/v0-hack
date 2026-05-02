# Project Architecture — Trend Monitor for Creators

## Vision

A proactive mobile-first web app that monitors social media (Instagram first, TikTok second) for emerging trends, hashtags, and viral formats — then automatically pushes personalized video/reel ideas to content creators. The agent runs continuously in the background; creators receive actionable, timely nudges rather than having to do their own trend research.

## Hackathon Scope

**MVP (must ship):**
- Background Vercel Workflow that scrapes Instagram trends every N hours
- Claude-powered idea generation tailored to a creator's niche
- Push notification delivery to the creator's mobile browser (web push or Expo)
- Simple mobile-first web UI: notification inbox + idea cards with accept/reject

**Stretch goal:**
- Mubit AI long-term memory: personalize ideas based on creator's style, history, and past feedback
- Multi-creator support with per-creator namespaced memory

## Stack

| Layer | Technology |
|---|---|
| Hosting & orchestration | Vercel (Workflows + Functions + Cron) |
| Frontend | Next.js (App Router), mobile-first |
| Social data | BrightData Instagram Scrapers (primary); TikTok Scrapers (secondary) |
| Idea generation | Claude API (claude-sonnet-4-6) |
| Push notifications | Web Push API (VAPID) or Expo Push |
| Persistence (inter-run state) | Vercel KV (Redis) — "seen trend IDs", creator subscriptions |
| Database | Vercel Postgres or Neon — users, creator profiles, notification history |
| Memory layer (stretch) | Mubit AI |

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKGROUND (Vercel Cron)                      │
│                                                                  │
│  cron: every 30min (Pro) or 4h (Hobby)                          │
│       │                                                          │
│       ▼                                                          │
│  GET /api/cron/poll-trends                                       │
│       │ calls workflow.start()                                   │
│       ▼                                                          │
│  trendMonitorWorkflow()                  ← 'use workflow'        │
│    │                                                             │
│    ├─ step: scrapeSocialTrends()         ← BrightData /trigger  │
│    │      └── BrightData webhook → POST /api/hooks/brightdata   │
│    │                (Vercel hook resumes workflow)               │
│    │                                                             │
│    ├─ step: filterNewTrends(raw, kvStore)← diff vs Vercel KV    │
│    │      └── skip if nothing new                               │
│    │                                                             │
│    ├─ step: getSubscribedCreators()      ← DB query             │
│    │                                                             │
│    └─ for each creator:                                          │
│         creatorNotifyWorkflow.start({ creatorId, trends })       │
│                                                                  │
│  creatorNotifyWorkflow()                 ← child workflow        │
│    ├─ step: fetchCreatorProfile()        ← DB                   │
│    ├─ step: [fetchCreatorMemory()]       ← Mubit recall()       │
│    ├─ step: generateVideoIdeas()         ← Claude API           │
│    └─ step: sendPushNotification()       ← Web Push / Expo      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Mobile Web)                         │
│                                                                  │
│  / (home)          → notification inbox (idea cards)            │
│  /ideas/:id        → idea detail: format, hashtags, angle       │
│  /settings         → niche, style prefs, notification settings  │
│  /onboarding       → new creator setup                          │
│                                                                  │
│  Push notification → deep links to /ideas/:id                   │
│                                                                  │
│  Creator taps Accept/Skip → POST /api/feedback                  │
│       └── step: [mubit.reflect()]  ← memory update (stretch)   │
└─────────────────────────────────────────────────────────────────┘
```

## Vercel Workflow Design Decisions

1. **Short-lived runs per cron tick** (not one eternal loop) — avoids 25K event / 10K step limits. Each tick = one run that completes.
2. **Child workflows per creator** — fan-out pattern; one parent discovers trends, N children handle per-creator personalization + push.
3. **Vercel KV for inter-run state** — store `Set<trendId>` of already-seen trends. Reset weekly.
4. **BrightData webhook → Vercel hook** — async scrape completion resumes the paused workflow. No polling loop inside the workflow.
5. **Pro plan required** — Hobby cron is once/day; useless for trend monitoring.
6. **Fluid Compute enabled** — `"fluid": true` in vercel.json; reduces cold starts, better for AI workloads.

## BrightData Scraping Strategy

### What we scrape (Instagram)

| Scraper | Frequency | Purpose |
|---|---|---|
| Hashtag Scraper | Every 4h | Core trend signal — niche hashtag velocity |
| Reels Scraper | Every 4h | Trending audio detection (`music_info.uses_count`) |
| Profile Scraper | Daily | Creator's own growth metrics |
| Post Scraper | On-demand | Deep dive on viral posts in niche |

### Trend signals we extract

- **Hashtag velocity**: `video_view_count / hours_since_post` for posts in a hashtag — rising velocity = emerging trend
- **Audio spread**: `music_info.uses_count` delta between scrape runs — rapid growth = trending sound
- **Format patterns**: clustering by `video_duration`, `product_type`, caption structure of top performers
- **Cross-niche spread**: same hashtag appearing in multiple niche scrapes

### Deduplication

Store `Set<shortcode>` in Vercel KV per niche. Only process new posts. Reset the set weekly to re-surface evergreen trends.

## Claude Idea Generation

Each idea card contains:
- **Hook**: the first 3 seconds (text/visual concept)
- **Format**: length, style (tutorial / reaction / trending sound overlay / POV / etc.)
- **Hashtags**: 5–8 suggested hashtags from trend data
- **Angle**: what makes this specific to this creator's niche
- **Why now**: the trend signal that triggered this idea

Prompt structure:
```
System: You are a content strategist for [creator niche].
        [Creator context from Mubit memory OR static profile]

User:   Trending right now in this niche:
        - Hashtag: #gymtok (velocity: +340% in 24h)
        - Audio: "original sound - fitcoach_mike" (uses_count: 48,200 → 52,100 in 4h)
        - Format: "reaction to gym fail" clips performing 3x avg views

        Generate 3 specific, actionable video ideas for this creator.
        For each: hook, format, hashtags, angle, why now.
        Avoid topics already covered: [covered_topics from memory].
```

## Push Notification Strategy

- **Trigger**: new trend detected + ideas generated for a subscribed creator
- **Frequency cap**: max 1 notification per creator per 4h (stored in KV)
- **Content**: preview of top idea — "🔥 [Hashtag] is trending in your niche. Here's a hook: ..."
- **Deep link**: taps open `/ideas/:id` with full idea detail
- **Feedback**: Accept / Skip buttons on idea card → recorded for Mubit memory (stretch)

## File Structure (target)

```
/
├── app/
│   ├── workflows/
│   │   ├── trend-monitor.ts       ← main workflow
│   │   └── creator-notify.ts      ← child workflow per creator
│   ├── steps/
│   │   ├── scrape-trends.ts       ← BrightData API calls
│   │   ├── filter-trends.ts       ← delta vs KV store
│   │   ├── generate-ideas.ts      ← Claude API
│   │   ├── send-push.ts           ← Web Push / Expo
│   │   └── memory.ts              ← Mubit recall/remember/reflect
│   ├── api/
│   │   ├── cron/poll-trends/      ← Vercel Cron trigger
│   │   ├── hooks/brightdata/      ← BrightData webhook receiver
│   │   ├── feedback/              ← creator Accept/Skip
│   │   └── push/subscribe/        ← Web Push subscription endpoint
│   ├── (mobile)/
│   │   ├── page.tsx               ← notification inbox
│   │   ├── ideas/[id]/page.tsx    ← idea detail
│   │   ├── settings/page.tsx      ← creator prefs
│   │   └── onboarding/page.tsx    ← new creator setup
│   └── layout.tsx
├── lib/
│   ├── brightdata.ts              ← BrightData client
│   ├── claude.ts                  ← Anthropic client
│   ├── mubit.ts                   ← Mubit client (stretch)
│   ├── kv.ts                      ← Vercel KV helpers
│   └── push.ts                    ← Web Push helpers
├── vercel.json                    ← crons + fluid compute
└── docs/                          ← this folder
```

## MVP Build Order

1. `vercel.json` — cron config, fluid compute
2. `lib/brightdata.ts` — trigger + webhook download
3. `app/api/cron/poll-trends` + `app/api/hooks/brightdata` — cron trigger + webhook receiver
4. `app/workflows/trend-monitor.ts` — main workflow (scrape → filter → fan-out)
5. `app/steps/generate-ideas.ts` — Claude idea generation with static creator profile
6. `app/steps/send-push.ts` — Web Push notification
7. Mobile UI: inbox + idea cards
8. **Stretch**: Mubit memory integration in `app/steps/memory.ts`

## Environment Variables

```bash
# Vercel
VERCEL_TOKEN=...

# BrightData
BRIGHTDATA_API_TOKEN=...

# Anthropic
ANTHROPIC_API_KEY=...

# Mubit (stretch)
MUBIT_API_KEY=...

# Web Push (VAPID)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:...

# Database
DATABASE_URL=...

# KV (Vercel KV auto-injected if using Vercel marketplace)
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```
