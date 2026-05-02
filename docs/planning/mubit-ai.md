# Mubit AI — Continual Learning Memory

Source: https://docs.mubit.ai/introduction + https://docs.mubit.ai/llms.txt

## Overview

Mubit is a **continual learning platform for AI agents**. It gives agents durable memory that persists across sessions, extracts reusable lessons from past interactions, and surfaces contextually relevant knowledge before each LLM call — all without retraining the model.

Mental model: a managed memory + learning layer that sits between your agent orchestration (Vercel Workflows / Claude) and your LLM calls.

## Core Loop: Write → Retrieve → Reflect → Reinforce

1. **Write** — agent stores experiences, outcomes, and facts as memory entries
2. **Retrieve** — relevant memories are fetched (with token budget) before each LLM call
3. **Reflect** — system extracts lessons from what worked and what didn't
4. **Reinforce** — lessons become available for future agent decisions

## Key Concepts

### Memory Entries
Stored agent interactions, outcomes, and facts. The atomic unit. Each entry has a payload plus metadata (timestamp, agent, namespace, session).

### Namespaces
Organizational scopes for memory isolation. Use namespaces to separate memory by creator (e.g., `creator:{id}`) or by domain (e.g., `trends:fitness`).

### Lanes
Named memory isolation for multi-agent specialist contexts. A "content style" lane vs. a "trend history" lane can coexist for the same creator.

### Sessions & Branching
Checkpoints for task continuity. Core sessions support reversible what-if exploration.

### Agents
Register agents, scope memory access, and pass work between them with structured handoffs and feedback.

### Projects & Agent Cards
Server-side declarative configuration for version control, review, and rollback. Useful for team environments; optional for hackathon.

## SDK Methods

```typescript
import { MubitClient } from '@mubit/sdk'; // verify exact package name

const mubit = new MubitClient({ apiKey: process.env.MUBIT_API_KEY });

// Store a memory
await mubit.remember({
  namespace: `creator:${creatorId}`,
  content: "Creator focuses on short-form gym motivation reels, 15–30s, uses trending audio",
  metadata: { type: 'style_preference', source: 'onboarding' }
});

// Retrieve relevant memories (semantic search)
const memories = await mubit.recall({
  namespace: `creator:${creatorId}`,
  query: "what content formats work best for this creator?",
  limit: 5
});

// Assemble token-budgeted context for an LLM call
const context = await mubit.getContext({
  namespace: `creator:${creatorId}`,
  query: currentTrends.join(', '),
  maxTokens: 1000  // respects your LLM's context budget
});

// Extract and reinforce lessons
await mubit.reflect({
  namespace: `creator:${creatorId}`,
  outcome: { ideaId, accepted: true, creatorFeedback: "loved the hook angle" }
});
```

## Transport & Auth

- **Auth**: API key (`MUBIT_API_KEY` env var)
- **Transport**: HTTP (REST) + gRPC options
- **SDK**: direct SDK wrapper for both

## Framework Integrations

Mubit has adapters for: **Vercel AI SDK**, CrewAI, LangGraph, LangChain, LlamaIndex, Google ADK, Agno, MCP.

The **Vercel AI SDK** adapter is the most relevant for our stack.

## Fit for Our Use Case

### Creator Profile Memory Schema

```typescript
// Suggested memory entries per creator:

// 1. Content style (set at onboarding, updated from feedback)
await mubit.remember({
  namespace: `creator:${creatorId}`,
  lane: 'style',
  content: "Prefers high-energy, motivational tone. Uses trending audio. 15–30s reels. Niche: fitness/gym.",
  metadata: { type: 'style' }
});

// 2. Topic history (what they've already covered)
await mubit.remember({
  namespace: `creator:${creatorId}`,
  lane: 'history',
  content: "Already made video on: protein timing, pull workout variations, morning routine",
  metadata: { type: 'covered_topics', updatedAt: new Date().toISOString() }
});

// 3. Idea feedback (what resonated)
await mubit.remember({
  namespace: `creator:${creatorId}`,
  lane: 'feedback',
  content: "Creator accepted: 'reaction to viral gym fail format'. Creator rejected: 'educational macro breakdown'",
  metadata: { type: 'feedback_signal' }
});

// 4. Platform performance (what performs well for them)
await mubit.remember({
  namespace: `creator:${creatorId}`,
  lane: 'performance',
  content: "Reels with trending audio get 3x views vs original audio. Humor hooks outperform motivational quotes.",
  metadata: { type: 'performance_insight', derivedFrom: 'post_analytics' }
});
```

### Integration Pattern in Notification Pipeline

```typescript
// In trendMonitorWorkflow, per-creator step:
async function generatePersonalizedIdeas(creatorId: string, trends: Trend[]) {
  'use step';

  // 1. Retrieve creator context before LLM call
  const context = await mubit.getContext({
    namespace: `creator:${creatorId}`,
    query: trends.map(t => t.hashtag).join(' '),
    maxTokens: 800
  });

  // 2. Call Claude with memory context injected
  const ideas = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    messages: [{
      role: 'user',
      content: `
        Creator context: ${context}

        Trending now: ${JSON.stringify(trends)}

        Generate 3 specific video ideas tailored to this creator's style.
        Avoid topics they've already covered.
      `
    }]
  });

  return ideas;
}

// After creator responds to push notification (accepts/rejects idea):
async function recordFeedback(creatorId: string, ideaId: string, accepted: boolean, notes?: string) {
  'use step';
  await mubit.reflect({
    namespace: `creator:${creatorId}`,
    outcome: { ideaId, accepted, notes }
  });
  // This trains the memory layer for future personalization
}
```

### When to Write Memory

| Event | Memory Action |
|---|---|
| Creator signs up | `remember()` style preferences, niche, platform |
| Creator posts new video | `remember()` topic covered, performance metrics (after 24h) |
| Creator accepts idea | `reflect()` positive signal on format/topic/angle |
| Creator rejects idea | `reflect()` negative signal + reason if provided |
| Trend detected in creator's niche | `remember()` trend in trend history lane |
| Weekly performance review | `remember()` updated performance insights |

## Gotchas

| Area | Detail |
|---|---|
| **Pricing / limits** | Not published in docs as of research date. Verify in Mubit dashboard or contact support before hackathon. |
| **Latency** | `getContext()` adds latency to LLM calls. Cache results per creator per workflow run (pass as step output rather than calling per-idea). |
| **Cold start for new creators** | No memories yet → generic ideas. Build a good onboarding flow to seed initial memories. |
| **Memory staleness** | Add `updatedAt` to metadata. Query with recency bias for volatile data (e.g., covered topics). |
| **Token budget** | Set `maxTokens` conservatively in `getContext()`. Mubit assembles context to fit — don't let it crowd out trend data in the prompt. |
| **Namespace collisions** | Use consistent namespace scheme: `creator:{uuid}`, not username (usernames can change). |

## Stretch Goal Priority

Mubit is the stretch goal. Build the pipeline first (scrape → generate → push) with a static creator profile in a JSON config. Then swap in Mubit for `getContext()` and add `reflect()` after feedback events. The integration points are well-defined and addable after MVP.
