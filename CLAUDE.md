# v0-hack — Trend Monitor for Creators

Hackathon project: a proactive agent that monitors Instagram/TikTok trends and pushes personalized video idea notifications to content creators. Mobile-first webapp built on Vercel Workflows (Track 1).

## Docs

Research docs are in `/docs/`. Read these before making architectural decisions:

- [`docs/architecture.md`](docs/architecture.md) — project vision, full data flow diagram, file structure, MVP build order, env vars
- [`docs/vercel-workflows.md`](docs/vercel-workflows.md) — Vercel Workflows: concepts, pricing, limits, gotchas, pipeline architecture
- [`docs/brightdata-instagram.md`](docs/brightdata-instagram.md) — BrightData Instagram scrapers: available endpoints, API interface, field schemas, webhook pattern
- [`docs/brightdata-tiktok.md`](docs/brightdata-tiktok.md) — BrightData TikTok scrapers: available endpoints, comparison to Instagram
- [`docs/mubit-ai.md`](docs/mubit-ai.md) — Mubit AI memory layer: SDK, integration pattern, creator memory schema (stretch goal)

## Key Architectural Decisions

- **Vercel Workflows** (Track 1): `'use workflow'` + `'use step'` directives; cron-triggered short-lived runs (not eternal loops)
- **Instagram first** for trends (Hashtag + Reels scrapers); TikTok as fallback/complement
- **BrightData async + webhook**: POST /trigger → receive webhook → download snapshot; integrated via Vercel Workflow hooks
- **Vercel KV** for inter-run dedup state (seen trend IDs); Postgres for users/profiles
- **Child workflows** for per-creator fan-out
- **Mubit AI** is the stretch goal — plug in at `recall()` before Claude call and `reflect()` after creator feedback

## Critical Gotchas

- **Pro plan required** for sub-daily cron (Hobby = once/day max — useless for trend monitoring)
- `'use workflow'` body must be deterministic — all I/O inside `'use step'` functions only
- Each step = 3 events; 25K events/run limit → ~8K steps max per run → use child workflows
- BrightData response is NDJSON by default — always request `?format=json`
- Verify exact BrightData collector IDs in the dashboard (they may be account-specific)

## Stack

Next.js (App Router) · Vercel Workflows · BrightData · Claude API (claude-sonnet-4-6) · Vercel KV · Neon/Vercel Postgres · Web Push (VAPID) · Mubit AI (stretch)
