# v0-hack — Creator Companion

Hackathon project: a mobile-first web app that gives content creators a live snapshot of what's happening in their personal "sphere of interest" on Instagram. Creator defines a follow list (accounts + hashtags); a Vercel Workflow scrapes it, distils it with Claude, ranks it against their profile, updates their dashboard, and pushes a notification.

**Track**: Vercel Workflows (Track 1)

## Docs

Read before making any architectural decisions:

- [`docs/architecture.md`](docs/architecture.md) — canonical design: pipeline, data flow, file structure, build order, env vars
- [`docs/vercel-workflows.md`](docs/vercel-workflows.md) — Vercel Workflows: concepts, pricing, limits, gotchas
- [`docs/brightdata-instagram.md`](docs/brightdata-instagram.md) — BrightData Instagram scrapers: endpoints, API shape, webhook pattern
- [`docs/brightdata-tiktok.md`](docs/brightdata-tiktok.md) — BrightData TikTok scrapers (future/fallback)
- [`docs/mubit-ai.md`](docs/mubit-ai.md) — Mubit AI memory layer (stretch goal only)

## Pipeline (5 steps)

```
Cron → creatorWorkflow
  1. fetchCreatorData()      ← DB: follow list + profile
  2. scrapeInstagram()       ← BrightData (profiles + hashtags from follow list)
  3. distilThemes()          ← Claude API  [Mubit getContext() — stretch]
  4. rankAgainstProfile()    ← Claude API  [Mubit getContext() — stretch]
  5a. persistSnapshot()      ← DB → dashboard
  5b. sendPushNotification() ← Web Push VAPID
```

## Locked Hackathon Decisions

- **Snapshot model, no over-time tracking** — each run is independent; no dedup, no delta, no Vercel KV for trends. May repeat content across runs — acceptable.
- **No "generate ideas" step** — output is ranked/filtered themes from the creator's sphere, not creative briefs.
- **Always both outputs** — every run updates the dashboard AND sends a push notification. No "importance" threshold.
- **Follow list is manual CRUD** — accounts + hashtags entered by creator on `/follow` page. No Instagram auth or auto-population.
- **Claude is explicit in two steps** — Distil (signal extraction) and Rank (personalization). Both use claude-sonnet-4-6.
- **Mubit wraps LLM steps only** — `getContext()` before Distil + Rank prompts; `reflect()` after feedback. Does NOT wrap the scrape step. This is stretch goal only.
- **No Vercel KV needed** — no inter-run state for this hack. Postgres handles everything.

## Critical Gotchas

- Vercel Workflows: **Pro plan required** for sub-daily cron. Hobby = once/day max.
- `'use workflow'` body must be deterministic — **all I/O inside `'use step'`** only.
- BrightData is **async by default** — trigger → webhook → download. Integrate with Vercel hook to resume workflow.
- BrightData default response format is NDJSON — always request `?format=json`.
- Verify BrightData collector IDs (account + hashtag scrapers) in the dashboard before coding.
- `withWorkflow(nextConfig)` required in `next.config.ts` or directives won't compile.
- Middleware: exclude `/.well-known/workflow/` from any Next.js middleware matchers.

## Stack

Next.js (App Router) · Vercel Workflows · BrightData Instagram · Claude API (claude-sonnet-4-6) · Neon/Vercel Postgres · Web Push (VAPID) · Mubit AI (stretch)
