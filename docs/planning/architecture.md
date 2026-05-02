# Project Architecture — Creator Companion

## Vision

A mobile-first web app that gives content creators a live snapshot of what's happening in their personal "sphere of interest" on Instagram. The creator defines a list of accounts and hashtags they care about. A background agent scrapes that sphere, distils it through an LLM, ranks it against the creator's profile, and both updates their dashboard and pushes a notification — on every run.

## Hackathon Scope

**MVP (must ship):**
- Onboarding + CRUD UI for the creator's follow list (accounts + hashtags)
- Background Vercel Workflow: scrape → distil → rank → update page + push notification
- Mobile-first "Creator Companion" dashboard showing the latest snapshot
- Push notification on each workflow run

**Explicit out of scope for this hack:**
- Over-time tracking / deduplication (each run is a fresh independent snapshot)
- "Generate video ideas" step (we rank/filter trends, we don't generate creative briefs)
- "Important vs. not" threshold logic (every run → always both update page and push)
- Importance-based frequency capping

**Stretch goal:**
- Mubit AI: wraps the two LLM steps (Distil + Rank) with `getContext()` to inject the creator's learned preferences and `reflect()` after feedback

## Hackathon Design Philosophy

Each workflow run is a **self-contained instant snapshot**. We don't compare against previous runs, don't deduplicate, don't track velocity over time. The run may surface the same trends as the previous run — that's acceptable. The value is the distilled, personalized view of the creator's sphere *right now*.

This simplifies the architecture significantly: no inter-run state, no KV for trend dedup, no delta logic.

## Pipeline

```
Vercel Cron (every N hours)
    │
    ▼
GET /api/cron/run-for-all-creators
    │  for each creator: creatorWorkflow.start({ creatorId })
    ▼

creatorWorkflow({ creatorId })              ← 'use workflow'
    │
    ├─ step: fetchCreatorData()             ← DB: follow list + user profile
    │
    ├─ step: scrapeInstagram(followList)    ← BrightData /trigger (profiles + hashtags)
    │       BrightData webhook →
    │       POST /api/hooks/brightdata →
    │       Vercel hook resumes workflow
    │
    ├─ step: distilThemes(rawData)          ← Claude API   [Mubit: getContext() stretch]
    │       Input: raw scraped posts, profiles, hashtag data
    │       Output: structured themes, patterns, notable content in this sphere
    │
    ├─ step: rankAgainstProfile(themes, profile)  ← Claude API   [Mubit: getContext() stretch]
    │       Input: distilled themes + creator profile (interests, style)
    │       Output: ordered list of most relevant themes for this creator
    │
    ├─ step: persistSnapshot(ranked)        ← DB: write latest snapshot for dashboard
    │
    └─ step: sendPushNotification(ranked)   ← Web Push API (VAPID)
```

## Where Claude Is Used

Claude (claude-sonnet-4-6) is the engine for **two** steps:

### 1. Distil step
Takes raw scraped data (posts, captions, hashtags, engagement counts, audio metadata) and extracts meaningful themes. No creator-specific knowledge needed here — pure signal extraction from the data.

```
System: You are a social media analyst. Extract the dominant themes, emerging patterns,
        and notable content from this raw Instagram data snapshot.

User:   Raw scraped data: [profiles, posts, hashtag feeds from follow list]

        Return structured JSON: themes[], each with name, description,
        evidence (top posts/accounts), and strength signal (high/medium/low).
```

### 2. Rank/Filter step
Takes the distilled themes + creator profile and produces a ranked, personalized view.

```
System: You are a content advisor for a creator.
        Creator profile: [interests, style, niche — from DB]
        [Mubit context injected here if stretch goal enabled]

User:   These themes are trending in this creator's sphere:
        [distilled themes from step 1]

        Rank them by relevance to this creator.
        For each: why it matters to them, what to watch.
        Drop anything irrelevant to their niche.
```

## Frontend Pages

```
/onboarding          → first-time setup: follow list seeding + profile (interests, style)
/follow              → CRUD: add/remove accounts and hashtags to monitor
/profile             → edit creator profile (interests, style, niche)
/ (dashboard)        → latest snapshot: ranked themes for this creator
                        shows: theme name, why it matters, key posts/accounts
                        "Last updated: X minutes ago"
/push-setup          → Web Push permission + subscription enrollment
```

No idea cards, no accept/reject for this hack. The dashboard shows the ranked snapshot and that's it.

## Follow List Design

The follow list is the seed for the Discover step. It contains:
- **Accounts**: Instagram usernames to monitor (scraped via Profile Scraper)
- **Hashtags**: hashtags to monitor (scraped via Hashtag Scraper)

Stored in DB per creator. CRUD managed entirely through the `/follow` page. No auto-population from Instagram.

The follow list drives *what* BrightData scrapes each run:
```typescript
// Every account → Profile Scraper call
// Every hashtag → Hashtag Scraper call
// All in parallel via Promise.all inside the scrape step
```

## Where Mubit Fits (Stretch)

Mubit wraps **only the two LLM steps** — Distil and Rank/Filter. Not the scrape step.

```typescript
// Before each LLM step:
const context = await mubit.getContext({
  namespace: `creator:${creatorId}`,
  query: currentSphereDescription,
  maxTokens: 500
});
// → inject context into system prompt

// After creator interacts with the dashboard (future feedback mechanism):
await mubit.reflect({ namespace: `creator:${creatorId}`, outcome: feedbackData });
```

This is the only integration point. Mubit improves LLM relevance over time as it learns what themes the creator finds valuable. For the hack, if time allows, wire `getContext()` into both LLM steps using the creator's stated interests as seed memories on onboarding.

## Stack

| Layer | Technology |
|---|---|
| Hosting & orchestration | Vercel (Workflows + Functions + Cron) |
| Frontend | Next.js (App Router), mobile-first |
| Social data | BrightData Instagram Scrapers (Hashtag + Profile primary) |
| LLM | Claude API — claude-sonnet-4-6 (Distil + Rank steps) |
| Push notifications | Web Push API (VAPID) |
| Database | Vercel Postgres / Neon — users, follow lists, snapshots |
| Memory layer (stretch) | Mubit AI (wraps Distil + Rank LLM steps only) |
| Inter-run state | None needed (snapshot model, no dedup) |

Note: **No Vercel KV needed** for this hack — no inter-run trend dedup. KV may be used for push subscription tokens if needed, but Postgres can handle that too.

## BrightData Scraping (Discover Step)

Each run scrapes the creator's entire follow list:

```typescript
async function scrapeInstagram(followList: FollowList) {
  'use step';
  const jobs = await Promise.all([
    ...followList.accounts.map(username =>
      brightdata.trigger('instagram_profile', [{ url: `https://instagram.com/${username}/` }])
    ),
    ...followList.hashtags.map(tag =>
      brightdata.trigger('instagram_hashtag', [{ hashtag: tag }])
    ),
  ]);
  // returns snapshot_ids; BrightData webhooks will resume the workflow
  return jobs.map(j => j.snapshot_id);
}
```

BrightData webhook → POST `/api/hooks/brightdata` → `bdHook.resume(snapshotId, data)` → workflow continues once all snapshots are ready.

Raw data passed to Distil step: profiles (follower counts, recent posts), hashtag top posts (captions, engagement, audio).

## File Structure

```
/
├── app/
│   ├── workflows/
│   │   └── creator-workflow.ts      ← single workflow (no child needed for hack)
│   ├── steps/
│   │   ├── fetch-creator-data.ts    ← DB: follow list + profile
│   │   ├── scrape-instagram.ts      ← BrightData trigger + await snapshots
│   │   ├── distil-themes.ts         ← Claude (+ Mubit stretch)
│   │   ├── rank-themes.ts           ← Claude (+ Mubit stretch)
│   │   ├── persist-snapshot.ts      ← write to DB
│   │   └── send-push.ts             ← Web Push VAPID
│   ├── api/
│   │   ├── cron/run/route.ts        ← Vercel Cron trigger
│   │   └── hooks/brightdata/route.ts← BrightData webhook receiver
│   ├── (app)/
│   │   ├── page.tsx                 ← dashboard: latest snapshot
│   │   ├── follow/page.tsx          ← CRUD: follow list
│   │   ├── profile/page.tsx         ← creator profile prefs
│   │   └── onboarding/page.tsx      ← first-time setup
│   └── layout.tsx
├── lib/
│   ├── brightdata.ts                ← BrightData API client
│   ├── claude.ts                    ← Anthropic SDK client
│   ├── mubit.ts                     ← Mubit client (stretch)
│   ├── db/
│   │   └── schema.ts                ← Drizzle or Prisma schema
│   └── push.ts                      ← Web Push helpers
├── vercel.json                      ← crons + fluid compute
└── docs/
```

## Build Order

1. **DB schema** — users, follow_list (accounts + hashtags), creator_profile, snapshots
2. **Frontend: onboarding + follow CRUD** — get the follow list working first; it seeds everything else
3. **`lib/brightdata.ts`** — trigger + webhook download
4. **`app/api/hooks/brightdata`** — webhook receiver + Vercel hook resume
5. **`app/workflows/creator-workflow.ts`** — wire up all steps
6. **`steps/distil-themes.ts`** — Claude call, hardcode prompt, test on real scrape data
7. **`steps/rank-themes.ts`** — Claude call with creator profile context
8. **`steps/persist-snapshot.ts` + dashboard** — show results in the UI
9. **`steps/send-push.ts` + push subscription** — Web Push VAPID
10. **Stretch: `lib/mubit.ts`** — wrap distil + rank steps with getContext()

## Environment Variables

```bash
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
```
