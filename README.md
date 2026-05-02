# Creator Companion

> A mobile-first web app that gives content creators a live snapshot of what's happening in their personal "sphere of interest" on Instagram.

**Demo:** https://www.loom.com/share/883feced0c5b4e5782ab454bc8237ea9

**Live app:** https://robota-v0-hack.vercel.app

---

## Overview

Creator Companion is a **Vercel Workflows** hackathon project (Track 1) that automates the process of discovering trending themes from a creator's curated Instagram sphere. Instead of manually scrolling through dozens of accounts and hashtags, creators get an AI-distilled snapshot of what matters to them—ranked by relevance to their niche.

### The Problem

Content creators need to stay on top of trends in their niche, but:
- Manually checking 20+ Instagram accounts daily is time-consuming
- Trends emerge across scattered posts, not in a single place
- Hard to know which themes are relevant to **your specific audience**
- Instagram's algorithm prioritizes engagement over signals that matter to you

### The Solution

Creator Companion watches your sphere and surfaces the themes that matter to **you**:
1. Define your **follow list** (accounts + hashtags)
2. A **Vercel Workflow** scrapes your sphere via BrightData
3. **Claude AI** distills themes and ranks them by relevance to your profile
4. Results land in your **mobile-first dashboard**
5. A **push notification** alerts you when fresh insights arrive

---

## Architecture

### Tech Stack

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS
- **Workflow Engine:** Vercel Workflows (durable execution)
- **AI:** Claude Sonnet 4.6 via Vercel AI Gateway
- **Scraping:** BrightData Instagram API
- **Database:** Neon Postgres (via Vercel)
- **Notifications:** Web Push API (VAPID)
- **Memory Layer:** Mubit AI SDK (stretch goal, not active)

### Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL WORKFLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Step 1: fetchCreatorData()                          │  │
│  │ ↳ Load follow list + creator profile from DB       │  │
│  └─────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Step 2: triggerInstagramScrapes()                   │  │
│  │ ↳ Send scrape jobs to BrightData                   │  │
│  │ ↳ Returns snapshot IDs (async)                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ [Workflow pauses, waits for BrightData webhook]    │  │
│  └─────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Step 3: downloadInstagramProfiles()                 │  │
│  │ Step 3: downloadInstagramHashtags()                 │  │
│  │ ↳ Download completed scraped data                  │  │
│  └─────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Step 4: distilThemes()                              │  │
│  │ ↳ Claude extracts 3-5 dominant themes              │  │
│  │ ↳ Uses Mubit memory for anti-repetition (future)  │  │
│  └─────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Step 5: rankAgainstProfile()                        │  │
│  │ ↳ Claude ranks themes by creator relevance         │  │
│  │ ↳ Adds "why it matters" + "what to watch"          │  │
│  └─────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Step 6a: persistSnapshot()                          │  │
│  │ ↳ Write themes to DB → dashboard updates           │  │
│  │                                                      │  │
│  │ Step 6b: sendPushNotification()                     │  │
│  │ ↳ Alert creator via Web Push                       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Snapshot model:** Each run is independent—no deduplication or trend tracking over time
- **No idea generation:** Output is ranked themes from the creator's sphere, not creative briefs
- **Always dual output:** Every run updates the dashboard **and** sends a push notification
- **Manual follow list:** Creators manually enter accounts + hashtags (no Instagram OAuth)
- **Two Claude steps:** Distil (extract themes) → Rank (personalize)
- **Deterministic workflow:** All I/O happens inside `'use step'` blocks for durability

---

## Project Structure

```
v0-hack/
├── app/
│   ├── (routes)/
│   │   ├── page.tsx              # Dashboard (home)
│   │   ├── follow/               # Manage follow list
│   │   ├── profile/              # Creator profile settings
│   │   ├── onboarding/           # Initial setup flow
│   │   └── run/                  # Secret workflow trigger page
│   ├── api/
│   │   ├── workflows/
│   │   │   ├── trigger/          # Manual workflow start
│   │   │   └── status/           # Check run status
│   │   ├── hooks/
│   │   │   └── brightdata/       # BrightData webhook receiver
│   │   ├── cron/run/             # Scheduled workflow trigger
│   │   ├── follows/              # CRUD for follow list
│   │   ├── snapshots/            # Read snapshots
│   │   └── push/subscribe/       # Web Push subscription
│   └── .well-known/workflow/     # Vercel Workflows runtime
├── workflows/
│   └── creator-workflow.ts       # Main workflow definition
├── steps/
│   ├── fetch-creator-data.ts     # Load DB data
│   ├── scrape-instagram.ts       # BrightData integration
│   ├── distil-themes.ts          # Claude theme extraction
│   ├── rank-themes.ts            # Claude personalization
│   ├── persist-snapshot.ts       # Write to DB
│   └── send-push.ts              # Web Push notification
├── lib/
│   ├── db.ts                     # Neon Postgres client
│   ├── ai-with-memory.ts         # Claude + Mubit wrapper
│   ├── brightdata.ts             # BrightData API client
│   └── types.ts                  # Shared TypeScript types
├── components/
│   ├── dashboard.tsx             # Main theme feed UI
│   └── ui/                       # Shared UI components
└── docs/
    ├── architecture.md           # Detailed design doc
    ├── vercel-workflows.md       # Workflows guide
    └── brightdata-instagram.md   # BrightData API reference
```

---

## Setup

### Prerequisites

- Node.js 24+ (or 22 LTS)
- Vercel account (Pro plan for sub-daily cron)
- BrightData account with Instagram collector
- Neon Postgres database (or any Postgres DB)

### 1. Clone and Install

```bash
git clone https://github.com/your-org/v0-hack.git
cd v0-hack
npm install
```

### 2. Environment Variables

Create `.env.local`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db

# BrightData
BRIGHTDATA_API_TOKEN=your_brightdata_token
BRIGHTDATA_COLLECTOR_ID=gd_l1vikfch901nx3by4

# Web Push (generate: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:you@example.com

# Optional: Telegram notifications
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Optional: Mubit AI memory layer (stretch goal)
MUBIT_API_KEY=
MUBIT_TIMEOUT_MS=60000
```

### 3. Database Schema

Run the schema migration:

```bash
# Connect to your database and run:
psql $DATABASE_URL < schema.sql
```

Or manually create tables:

```sql
CREATE TABLE creators (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  niche TEXT,
  interests TEXT[],
  style TEXT,
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE follow_lists (
  id SERIAL PRIMARY KEY,
  creator_id INT REFERENCES creators(id),
  accounts TEXT[],
  hashtags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE snapshots (
  id SERIAL PRIMARY KEY,
  creator_id INT REFERENCES creators(id),
  themes JSONB NOT NULL,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workflow_runs (
  id SERIAL PRIMARY KEY,
  creator_id INT REFERENCES creators(id),
  status TEXT NOT NULL,
  step TEXT,
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  creator_id INT REFERENCES creators(id),
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Deploy to Vercel

```bash
# Link project
npx vercel link

# Add environment variables
npx vercel env add DATABASE_URL production
npx vercel env add BRIGHTDATA_API_TOKEN production
# ... add remaining env vars

# Deploy
npx vercel deploy --prod
```

### 5. Set Up BrightData Webhook

In your BrightData dashboard:
1. Navigate to your Instagram collector settings
2. Set webhook URL to: `https://your-app.vercel.app/api/hooks/brightdata`
3. Enable webhook notifications for job completion

### 6. Configure Cron (Optional)

For scheduled runs, create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/run",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Or use the Vercel dashboard to configure cron jobs.

### 7. Run Locally

```bash
npm run dev
```

Visit:
- Dashboard: http://localhost:3000
- Onboarding: http://localhost:3000/onboarding
- Manual trigger: http://localhost:3000/run

---

## Usage

### First Run

1. Visit `/onboarding` to set up your creator profile
2. Go to `/follow` to add Instagram accounts and hashtags
3. Trigger a workflow run via `/run` (secret page)
4. Wait ~30-60 seconds for pipeline to complete
5. View results on the dashboard (`/`)

### Daily Workflow

Once configured, the workflow runs automatically via cron (if enabled), or you can trigger manually at `/run`.

---

## Key Features

### 🎯 Personalized Ranking

Claude ranks themes by relevance to **your** niche, interests, and style. Each theme includes:
- **Source count:** How many posts support this theme
- **Why it matters:** Relevance to your specific audience
- **What to watch:** Specific accounts or signals to monitor

### 📱 Mobile-First Design

Neo-brutalist UI optimized for mobile creators who live on their phones.

### 🔔 Push Notifications

Web Push alerts when new insights arrive (no app install required).

### 🧠 Memory Layer (Stretch Goal)

Mubit AI integration for:
- Anti-repetition: Don't surface the same themes twice
- Personalization: Learn which themes you engage with
- Profile drift detection: Notice when your interests evolve

---

## Roadmap

- [ ] Multi-creator support (currently single demo creator)
- [ ] TikTok integration (BrightData TikTok scraper)
- [ ] Historical trend tracking (requires Vercel KV or similar)
- [ ] Idea generation step (from themes → content briefs)
- [ ] Mobile app (React Native)
- [ ] Instagram OAuth (auto-populate follow list)

---

## Contributing

This is a hackathon project, but PRs are welcome! Please read `docs/architecture.md` before contributing.

---

## License

MIT

---

## Acknowledgments

Built for the **Vercel Workflows Hackathon** (Track 1).

- **Vercel Workflows:** Durable execution for long-running pipelines
- **BrightData:** Instagram scraping API
- **Claude (Anthropic):** Theme extraction and ranking
- **Mubit AI:** Memory layer for continual learning