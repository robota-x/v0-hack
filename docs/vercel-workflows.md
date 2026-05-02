# Vercel Workflows

Source: https://vercel.com/docs/workflows + https://vercel.com/docs/workflows/concepts + https://vercel.com/docs/workflows/pricing

## Overview

Vercel Workflows is a fully managed **durable execution platform** for JS/TS (and Python beta). You write ordinary async functions with two directives and get: pause/resume across deployments, built-in retries, managed state, and full observability — no YAML, no state machines.

Under the hood: **Vercel Functions** (compute) + **Vercel Queues** (orchestration) + **managed persistence** (event log / state store).

## Core Abstractions

### 1. Workflow — `'use workflow'`

A stateful coordinator. Marks a function as durable: it remembers progress and replays deterministically from the last checkpoint after crashes or deploys.

```typescript
export async function trendMonitorWorkflow(payload: { creatorId: string }) {
  'use workflow';

  const trends = await scrapeTrends();
  const ideas  = await generateVideoIdeas(trends);
  await pushNotifyCreator(payload.creatorId, ideas);
}
```

**Determinism rule**: code between `await` calls in the workflow body replays on every resume. Never put non-deterministic operations (Date.now(), Math.random(), direct fetch()) directly in the workflow body — all I/O must live inside steps.

### 2. Step — `'use step'`

A stateless, durable unit of work. Each step:
- Has built-in retries on transient failures
- Compiles into its own isolated API route
- Suspends the workflow while executing (zero coordinator compute)
- Memoizes its result — replays use the cached output, not re-execution

```typescript
async function scrapeTrends() {
  'use step';
  const [ig, tt] = await Promise.all([fetchInstagram(), fetchTikTok()]);
  return { instagram: ig, tiktok: tt };
}
```

### 3. Sleep

Pauses the workflow without consuming compute. No ceiling on duration.

```typescript
import { sleep } from 'workflow';
await sleep('30 minutes'); // or '7 days', '1 hour', etc.
```

### 4. Hooks — external events

Blocks the workflow until an external event arrives (webhook, user action, push delivery confirmation).

```typescript
import { defineHook } from 'workflow';

const ideaFeedbackHook = defineHook<{ accepted: boolean; notes?: string }>();

// inside workflow:
const events = ideaFeedbackHook.create({ token: `creator-${creatorId}` });
for await (const event of events) {
  if (event.accepted) break;
  // regenerate with event.notes
}

// from mobile app API route (POST /api/feedback):
await ideaFeedbackHook.resume(`creator-${creatorId}`, { accepted: true });
```

### 5. Streams

```typescript
// write inside a step:
const writer = getWritable<TrendEvent>().getWriter();
await writer.write(trendData);

// read from API route (SSE):
const run = getRun(runId);
const readable = run.getReadable(); // replays from start then streams live
```

Useful for the mobile client to stream real-time notification delivery status.

## Triggering Workflows

Workflows are started by calling `.start()`. They do **not** self-schedule — pair with Vercel Cron for polling loops.

```typescript
// app/api/cron/poll-trends/route.ts
import { trendMonitorWorkflow } from '../../../workflows/monitor';

export async function GET() {
  await trendMonitorWorkflow.start({ creatorId: 'all' });
  return Response.json({ started: true });
}
```

```json
// vercel.json
{
  "fluid": true,
  "crons": [
    { "path": "/api/cron/poll-trends", "schedule": "*/30 * * * *" }
  ]
}
```

**Hobby plan cron**: max once per day — useless for trend monitoring. **Pro plan required** for per-minute/per-30-min schedules.

## Project Setup

```bash
npm i workflow
npx plugins add vercel/vercel-plugin   # registers Vercel integration

# next.config.ts
import { withWorkflow } from 'workflow/next';
export default withWorkflow({});
```

## Observability

Every step input/output, sleep, hook, and error is recorded automatically. View all runs at: `Vercel Dashboard → [Project] → Observability → Workflows`. No extra code required.

## Pricing

| Resource | Hobby Included | On-demand |
|---|---|---|
| Workflow Steps | 50,000 free | $2.50 / 100,000 steps |
| Workflow Storage | 720 GB-Hours | $0.00069 / GB-Hour |

Functions compute billed separately at standard Vercel Function rates. Enable **Fluid Compute** (`"fluid": true`) for lower cost + higher performance.

## Limits

| Limit | Value |
|---|---|
| Events per run | 25,000 |
| Steps per run | 10,000 |
| Max payload size | 50 MB |
| Max individual step runtime | Vercel Function limit (300s Hobby / 800s Pro with Fluid) |
| Max workflow replay duration | 240s |
| Max run duration | Unlimited |
| Max sleep duration | Unlimited |
| Max total entity storage per run | 2 GB |
| Run creations per second | 1,000 |
| Concurrent runs | Up to 100,000 |

Storage retention after run completion: 1 day (Hobby), 7 days (Pro), 30 days (Enterprise).

> Runs exceeding 2,000 events or 1 GB storage have slower replay. Use child workflows to break up long runs.

## Gotchas for Our Use Case

1. **Use Pro plan** — Hobby's once-per-day cron is non-functional for trend monitoring.
2. **Short-lived runs per cron tick**, not one eternal loop. An eternal loop hits the 25K event / 10K step limits. Better: each cron tick starts a fresh short-lived workflow run (scrape → generate → push → done).
3. **State between runs needs external storage** (Vercel KV / Postgres) — workflow state is scoped to one run. Store "already seen trend IDs" externally.
4. **Keep workflow inputs small** (under 4.5 MB Vercel Function body limit). Do heavy data fetching inside steps, not as inputs.
5. **Fan-out with child workflows** for many creators — don't put N `sendPush` calls in one run. Call `creatorWorkflow.start({ creatorId })` inside the main workflow.
6. **Enable Fluid Compute** — `"fluid": true` in `vercel.json`, better for AI workloads.
7. **Non-determinism gotcha** — `Date.now()`, random numbers, direct API calls in the workflow body (not in a step) corrupt state on replay.

## Pipeline Architecture for This Project

```
vercel.json cron (every 30 min, Pro plan)
    │
    ▼
GET /api/cron/poll-trends
    │  calls .start()
    ▼
trendMonitorWorkflow({ creatorId: 'all' })   ← 'use workflow'
    ├── step: scrapeSocialTrends()            ← BrightData API
    ├── step: filterNewTrends(raw, kvStore)   ← diff vs Vercel KV
    ├── step: generateVideoIdeas(newTrends)   ← Claude API
    ├── step: getSubscribedCreators(trends)   ← DB lookup
    └── step: sendPushNotifications(...)      ← Expo / FCN

Per-creator variant (child workflow):
    creatorWorkflow({ creatorId, ideas })
        ├── step: fetchCreatorMemory(id)     ← Mubit AI recall()
        ├── step: rankIdeasForCreator(...)   ← Claude + memory context
        └── step: sendPush(creatorId, ...)  ← push notification
```

## Reference Links

- Workflow SDK full docs: https://workflow-sdk.dev
- Vercel Workflows concepts: https://vercel.com/docs/workflows/concepts
- Vercel Workflows pricing: https://vercel.com/docs/workflows/pricing
- Claude Managed Agent guide: https://vercel.com/kb/guide/claude-managed-agent-vercel
- Source: https://github.com/vercel-labs/claude-managed-agents-starter
