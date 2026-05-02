# Creator Companion — Current State

What's actually shipped in the repo right now: the website, the database, and the API surface.

**Not yet built:** the workflow itself (`app/workflows/creator-workflow.ts`), the BrightData client (`lib/brightdata.ts`), the Claude steps (`steps/distil-themes.ts`, `steps/rank-themes.ts`), the push sender, and Mubit. The HTTP boundary the workflow will plug into already exists — see [Workflow seams](#workflow-seams).

---

## Stack

- **Next.js 15** App Router, React 19, TypeScript, Tailwind v4
- **Neon** Postgres via `@neondatabase/serverless`
- **SWR** for client-side data fetching
- **Vercel Sandbox** for dev. Env vars live at `/vercel/share/.env.project`; `npm run dev` sources them via `node --env-file-if-exists`.

---

## Hackathon scope: single-creator demo mode

There is no auth. Every route operates on a hardcoded creator id (`DEMO_CREATOR_ID = 1`, defined in [`lib/db.ts`](../lib/db.ts)). One row in `creators` is seeded by the migration. To generalize to multi-tenant later, swap the constant for a session lookup — every query is already scoped by `creator_id`.

---

## Database schema

Applied to Neon project `rough-art-23270133` via the Neon MCP. Re-run the same `CREATE TABLE IF NOT EXISTS` statements to recreate.

### `creators`
| column | type | notes |
|---|---|---|
| `id` | `SERIAL PK` | demo row is `id=1` |
| `name` | `TEXT` | |
| `niche` | `TEXT` | one-line self-description |
| `interests` | `TEXT[]` | tag-style list |
| `style` | `TEXT` | tone / voice |
| `onboarded` | `BOOLEAN` | gates `/` → `/onboarding` redirect |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | |

### `follow_accounts`
| column | type | notes |
|---|---|---|
| `id` | `SERIAL PK` | |
| `creator_id` | `INT FK → creators(id)` `ON DELETE CASCADE` | |
| `username` | `TEXT` | normalized: lowercase, no `@`, `[a-z0-9._]{1,30}` |
| `created_at` | `TIMESTAMPTZ` | |
| | | `UNIQUE (creator_id, username)` |

### `follow_hashtags`
| column | type | notes |
|---|---|---|
| `id` | `SERIAL PK` | |
| `creator_id` | `INT FK` `ON DELETE CASCADE` | |
| `tag` | `TEXT` | normalized: lowercase, no `#`, `[a-z0-9_]{1,80}` |
| `created_at` | `TIMESTAMPTZ` | |
| | | `UNIQUE (creator_id, tag)` |

### `snapshots`
| column | type | notes |
|---|---|---|
| `id` | `SERIAL PK` | |
| `creator_id` | `INT FK` `ON DELETE CASCADE` | |
| `themes` | `JSONB` | array of `SnapshotTheme` (see below) |
| `summary` | `TEXT` | optional one-paragraph overview |
| `created_at` | `TIMESTAMPTZ` | dashboard reads `ORDER BY created_at DESC LIMIT 1` |

Index: `snapshots_creator_created_idx (creator_id, created_at DESC)`.

`SnapshotTheme` shape (from [`lib/db.ts`](../lib/db.ts)):
```ts
type SnapshotTheme = {
  rank: number;
  title: string;
  summary: string;
  source_count?: number;
  why_it_matters?: string;
};
```

### `push_subscriptions`
| column | type | notes |
|---|---|---|
| `id` | `SERIAL PK` | |
| `creator_id` | `INT FK` `ON DELETE CASCADE` | |
| `endpoint` | `TEXT UNIQUE` | upserted on re-subscribe |
| `p256dh`, `auth` | `TEXT` | Web Push keys |
| `created_at` | `TIMESTAMPTZ` | |

### `workflow_runs`
| column | type | notes |
|---|---|---|
| `id` | `SERIAL PK` | |
| `creator_id` | `INT FK` `ON DELETE CASCADE` | |
| `status` | `TEXT` | `'queued' \| 'running' \| 'completed' \| 'failed'` (convention; not enforced) |
| `step` | `TEXT` | name of the current/last step |
| `error` | `TEXT` | populated on failure |
| `started_at`, `completed_at` | `TIMESTAMPTZ` | |

Index: `workflow_runs_creator_started_idx (creator_id, started_at DESC)`.

---

## API surface

All routes are Next.js App Router handlers under `app/api/**/route.ts`. All marked `dynamic = "force-dynamic"`. No auth on read/write of demo creator data; the only protected route is `POST /api/snapshots` (Bearer token, intended for the workflow).

### Creator profile

#### `GET /api/creator`
Returns the current creator row. `404` if missing (shouldn't happen — the migration seeds one).

```json
{
  "id": 1, "name": "Mira", "niche": "Sustainable fashion",
  "interests": ["mending","deadstock"], "style": "Warm and curious",
  "onboarded": true, "created_at": "...", "updated_at": "..."
}
```

#### `PATCH /api/creator`
Partial update. Any field can be omitted; `COALESCE` keeps the existing value. Setting `onboarded: true` is what flips `/` from redirecting to `/onboarding` over to rendering the dashboard.

```jsonc
// request
{ "name": "Mira", "niche": "Sustainable fashion",
  "interests": ["mending","deadstock"], "style": "Warm and curious",
  "onboarded": true }
// response: full Creator row
```

### Follow list

#### `GET /api/follows`
Returns both lists for the demo creator, newest first.

```json
{
  "accounts": [{"id": 1, "creator_id": 1, "username": "username", "created_at": "..."}],
  "hashtags": [{"id": 1, "creator_id": 1, "tag": "sustainability", "created_at": "..."}]
}
```

#### `POST /api/follows/accounts`
- Body: `{ "username": "@whoever" }` — `@` and surrounding whitespace are stripped, lowercased
- Validation: `^[a-z0-9._]{1,30}$`
- Idempotent on `(creator_id, username)` — re-POSTing returns the existing row
- `201` on success, `400` on validation failure

#### `DELETE /api/follows/accounts/[id]`
`200` always (no-op if id doesn't exist or doesn't belong to the demo creator).

#### `POST /api/follows/hashtags`
- Body: `{ "tag": "#sustainable_fashion" }` — `#` and whitespace stripped, lowercased
- Validation: `^[a-z0-9_]{1,80}$`
- Idempotent on `(creator_id, tag)`
- `201` on success, `400` on validation failure

#### `DELETE /api/follows/hashtags/[id]`
Same shape as the accounts delete.

### Snapshots (dashboard data)

#### `GET /api/snapshots/latest`
Returns the most recent snapshot for the demo creator, or `null` if none.

```json
{ "snapshot": {
    "id": 12, "creator_id": 1,
    "themes": [{ "rank": 1, "title": "...", "summary": "...", "source_count": 7, "why_it_matters": "..." }],
    "summary": "...",
    "created_at": "..."
  }
}
// or { "snapshot": null }
```

#### `POST /api/snapshots`  *(workflow → app boundary)*
Used by the workflow's `persistSnapshot` step.

- **Auth:** if `INTERNAL_API_TOKEN` is set, requires `Authorization: Bearer <token>`. If unset (local dev), accepts any caller.
- Body: `{ creator_id?: number, themes: SnapshotTheme[], summary?: string | null }` — `creator_id` defaults to the demo id.
- `201` returns the inserted row.
- `401` if the token is set and missing/wrong.

### Workflow control

#### `POST /api/workflows/trigger`
Manually kicks off the creator workflow. Currently this only inserts a `workflow_runs` row with `status='queued'` and step `'fetchCreatorData'` so the UI can show a "queued" state. **TODO:** dispatch the actual workflow (commented in the route file). Returns `202` with `{ run: {...} }`.

#### `GET /api/workflows/status`
Latest run for the demo creator. Used by the dashboard to drive the "sweep" button state.

```json
{ "run": { "id": 7, "status": "running", "step": "scrapeInstagram",
           "error": null, "started_at": "...", "completed_at": null } }
// or { "run": null }
```

### Push notifications

#### `POST /api/push/subscribe`
Body matches the standard `PushSubscription.toJSON()` output:
```json
{ "endpoint": "https://...", "keys": { "p256dh": "...", "auth": "..." } }
```
Upserts on `endpoint`. `201` on success, `400` if any field missing.

#### `DELETE /api/push/subscribe`
Body: `{ "endpoint": "..." }`. Removes the subscription. `200` always.

### BrightData webhook

#### `POST /api/hooks/brightdata`
Public delivery webhook. Currently logs and acks with `{ "received": true }` so BrightData doesn't retry. **TODO:** forward to the active workflow run once the workflow exists.

---

## App routes (pages)

All mobile-first. Bottom nav (`components/bottom-nav.tsx`) renders globally on `/`, `/follow`, `/profile`.

| route | file | purpose |
|---|---|---|
| `/` | `app/page.tsx` → `components/dashboard.tsx` | dashboard. Server-side checks `onboarded` and redirects to `/onboarding` if false. Renders ranked theme cards, summary, and a "sweep now" button that POSTs `/api/workflows/trigger`. |
| `/onboarding` | `app/onboarding/page.tsx` → `components/onboarding-flow.tsx` | 5-step flow: welcome → name → niche → interests + style → seed accounts/hashtags. Final step PATCHes `onboarded=true` and redirects to `/`. |
| `/follow` | `app/follow/page.tsx` → `components/follow-manager.tsx` | accounts + hashtags CRUD using the chip UI. SWR-backed. |
| `/profile` | `app/profile/page.tsx` → `components/profile-editor.tsx` + `components/interest-chips.tsx` | edits name, niche, interests, style. Save PATCHes `/api/creator`. |

### Server-side onboarding gate

`app/page.tsx` does:
```ts
const rows = await sql`SELECT onboarded FROM creators WHERE id = ${DEMO_CREATOR_ID}`;
if (!rows[0]?.onboarded) redirect("/onboarding");
```
This is the single source of truth for "should the user see the dashboard or the wizard". When auth lands, swap the demo id for the session creator id.

---

## Component map

```
components/
  ui/                      shadcn-style primitives (button, input, card, badge)
  bottom-nav.tsx           floating pill nav, hidden on /onboarding via the layout
  page-header.tsx          shared title + subtitle block
  dashboard.tsx            theme cards + sweep button (uses /api/snapshots/latest, /api/workflows/*)
  follow-manager.tsx       SWR-backed accounts + hashtags lists
  profile-editor.tsx       form, PATCHes /api/creator
  interest-chips.tsx       reusable tag-input used by profile + onboarding
  onboarding-flow.tsx      multi-step wizard, owns its own state + final commit
```

`lib/`:
- `db.ts` — Neon SQL client + shared `Creator` / `FollowAccount` / `FollowHashtag` / `Snapshot` / `SnapshotTheme` types and `DEMO_CREATOR_ID`. Anything talking to Postgres goes through here.
- `utils.ts` — `cn` (tailwind class merge), `normalizeUsername`, `normalizeHashtag`, `formatRelativeTime`.
- `fetcher.ts` — SWR fetcher.

---

## Workflow seams

These are the places the workflow plugs in. Nothing else needs to change in the website to support it.

1. **Read inputs** — The workflow's `fetchCreatorData()` step reads:
   - `creators` row by id (or `GET /api/creator`)
   - `follow_accounts` and `follow_hashtags` (or `GET /api/follows`)
2. **Write output** — `persistSnapshot()` `POST`s to `/api/snapshots` with `Authorization: Bearer ${INTERNAL_API_TOKEN}`. The dashboard picks it up automatically on next poll/load.
3. **Track progress** — Each step `UPDATE`s the latest `workflow_runs` row (`status`, `step`, `error`, `completed_at`). The dashboard's "sweep" button reads `/api/workflows/status` to render busy state.
4. **Manual trigger** — `POST /api/workflows/trigger` is where `await trigger("creator-workflow", { creatorId, runId })` (or equivalent) needs to be added. Inserts the `workflow_runs` row first; pass that `runId` into the workflow.
5. **BrightData webhook** — `POST /api/hooks/brightdata` is where snapshot-ready payloads land. The workflow's webhook step subscribes here; this route currently just acks.
6. **Push delivery** — The workflow's `sendPush()` step reads `push_subscriptions` and sends VAPID-signed payloads directly. The website is only responsible for collecting subscriptions via `POST /api/push/subscribe`.

---

## Environment variables

Required:
- `DATABASE_URL` — Neon connection string. Provided by the integration. Sourced from `/vercel/share/.env.project` in dev.

Optional / workflow-side:
- `INTERNAL_API_TOKEN` — guards `POST /api/snapshots`. Set in production; dev leaves it unset and the route accepts unauthenticated calls.
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — Web Push keys, used by the workflow's push step (not by the website).
- `BRIGHTDATA_*`, `ANTHROPIC_API_KEY`, etc. — workflow concerns; the website doesn't read them.

---

## Quick test recipe

```bash
# fresh creator
curl -s http://localhost:3000/api/creator

# add a follow
curl -X POST http://localhost:3000/api/follows/accounts \
  -H "Content-Type: application/json" -d '{"username":"@nytimes"}'

# finish onboarding
curl -X PATCH http://localhost:3000/api/creator \
  -H "Content-Type: application/json" \
  -d '{"name":"Mira","niche":"Sustainable fashion","interests":["mending"],"style":"Warm","onboarded":true}'

# fake a snapshot the workflow would write
curl -X POST http://localhost:3000/api/snapshots \
  -H "Content-Type: application/json" \
  -d '{"themes":[{"rank":1,"title":"x","summary":"y"}],"summary":"z"}'

# read it back
curl -s http://localhost:3000/api/snapshots/latest
```
