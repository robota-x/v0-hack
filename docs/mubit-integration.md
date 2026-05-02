# Mubit AI Integration — Architecture & Design

**Status:** In progress (workflow interface implemented, learning interface TBD)  
**Purpose:** Add continual learning and anti-repetition to theme discovery via memory-augmented LLM calls

---

## Why Mubit

### The Problem
Without memory, our workflow has no cross-run awareness:
- Same trending themes surface repeatedly across runs
- No learning from what creators engage with
- No adaptation to implicit preferences (what they click vs what profile says)
- Static personalization (profile never evolves without manual edits)

### What Mubit Provides
1. **Anti-repetition filter** — "Already surfaced #aiagents 2 days ago" → deprioritize
2. **Cross-run personalization** — "Creator engages with tool launches, ignores theory" → boost tool themes
3. **Implicit preference learning** — Track what themes they mark as useful → refine future ranking
4. **Evolving creator understanding** — Profile drift detection (says AI agents, clicks indie hacking)

### Why Not Build This Ourselves
- Memory retrieval (semantic search across past runs) = vector DB + embedding pipeline
- Learning loop (extract patterns from feedback) = training data pipeline
- Token budget management (fit memory into prompts) = context packing logic
- Namespace isolation (multi-creator memory) = data partitioning

Mubit gives us all 4 out of the box. For a hackathon, this is a force multiplier.

---

## Integration Strategy

### Principle: Wrapper, Not Rewrite
Mubit wraps our existing LLM calls; Claude code stays unchanged. If Mubit fails or is unavailable, LLM calls degrade gracefully to memory-less operation.

### Architecture Pattern
```
┌─────────────────────────────────────────────────┐
│  Vercel Workflow Step                           │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ mubit.getContext()                        │  │
│  │   ↓                                       │  │
│  │ generateWithClaude({ prompt + context }) │  │
│  │   ↓                                       │  │
│  │ mubit.remember() [async, non-blocking]   │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Silent degradation on Mubit failure:           │
│  - getContext() returns empty string            │
│  - remember() logs error, continues             │
└─────────────────────────────────────────────────┘
```

### Failure Mode
If `MUBIT_API_KEY` is missing or Mubit API is down:
- `getContext()` returns `""` → LLM call proceeds without memory context
- `remember()` logs warning → workflow continues
- **Result:** Workflow succeeds, just without memory augmentation
- **Visibility:** Server logs capture Mubit failures; no user-facing errors

---

## Integration Points

### Point 1: Distil Step (Theme Extraction)
**File:** `steps/distil-themes.ts`

**Before Mubit:**
```typescript
const themes = await generateWithClaude({
  system: 'You are a social media analyst...',
  prompt: `Analyze: ${JSON.stringify(data)}`
});
```

**With Mubit:**
```typescript
const memoryContext = await mubit.getContext({
  namespace: `creator:${creatorId}`,
  query: 'trending themes recently surfaced, engagement patterns',
  maxTokens: 600
});

const themes = await generateWithClaude({
  system: 'You are a social media analyst...',
  prompt: `
    Memory context (themes we've already highlighted):
    ${memoryContext}
    
    New data to analyze:
    ${JSON.stringify(data)}
    
    Extract NEW themes not already covered in memory.
  `
});

// Non-blocking write
await mubit.remember({
  namespace: `creator:${creatorId}`,
  content: `Surfaced themes: ${themes.map(t => t.name).join(', ')}`,
  metadata: { step: 'distil', timestamp: new Date().toISOString() }
});
```

**Value:** Anti-repetition — deprioritize themes already shown recently.

---

### Point 2: Rank Step (Personalization)
**File:** `steps/rank-themes.ts`

**Before Mubit:**
```typescript
const ranked = await generateWithClaude({
  system: 'You are a content strategist...',
  prompt: `Profile: ${JSON.stringify(profile)}\n\nThemes: ${JSON.stringify(themes)}`
});
```

**With Mubit:**
```typescript
const memoryContext = await mubit.getContext({
  namespace: `creator:${creatorId}`,
  query: `${profile.niche} creator preferences, engagement history`,
  maxTokens: 800
});

const ranked = await generateWithClaude({
  system: 'You are a content strategist...',
  prompt: `
    Creator profile:
    ${JSON.stringify(profile)}
    
    Historical context (what this creator engages with):
    ${memoryContext}
    
    Themes to rank:
    ${JSON.stringify(themes)}
    
    Prioritize themes similar to past high-engagement patterns.
  `
});

// Non-blocking write
await mubit.remember({
  namespace: `creator:${creatorId}`,
  content: `Ranked themes for ${profile.niche}: top = ${ranked[0].name} (score ${ranked[0].relevanceScore})`,
  metadata: { step: 'rank', timestamp: new Date().toISOString() }
});
```

**Value:** Personalization based on implicit preferences, not just static profile.

---

### Point 3: Feedback Loop (Future — Dashboard)
**File:** `app/api/feedback/route.ts` (not yet built)

When creator marks a theme as useful/not useful:
```typescript
POST /api/feedback
{ themeId, creatorId, useful: true }

// In handler:
await mubit.reflect({
  namespace: `creator:${creatorId}`,
  outcome: { themeId, useful, timestamp: new Date().toISOString() }
});
```

**Value:** Supervised learning — Mubit extracts patterns from feedback, surfaces them in future `getContext()` calls.

---

## Memory Schema

### Namespace Design
```
creator:{creatorId}
```
- Isolates memory per creator
- Future-proof for multi-tenant (replace `DEMO_CREATOR_ID` with real user IDs)

### Memory Entry Types

| Type | Content | Metadata | Written By |
|---|---|---|---|
| `theme_surfaced` | "Surfaced themes: Agentic AI frameworks, Vibe coding" | `{ step: 'distil', timestamp }` | `distilThemes` |
| `theme_ranked` | "Ranked for AI/hacking niche: top = Agentic AI (score 97)" | `{ step: 'rank', timestamp }` | `rankAgainstProfile` |
| `feedback` | "Creator marked theme 'Agentic AI frameworks' as useful" | `{ themeId, useful: true, timestamp }` | Feedback API (future) |
| `profile_snapshot` | "Creator profile: niche=AI agents, interests=[LLMs, security]" | `{ source: 'onboarding', timestamp }` | Onboarding flow (future) |

### Token Budget Allocation
- `distilThemes` context: 600 tokens (focus on recent theme history)
- `rankAgainstProfile` context: 800 tokens (focus on engagement patterns + profile drift)
- Leave 2500-3000 tokens for raw Instagram data in prompt

---

## Vercel AI SDK Integration

**Source:** https://docs.mubit.ai/sdk/framework-integrations#vercel-ai-sdk

Mubit provides a Vercel AI SDK adapter. Two approaches:

### Approach A: Manual Wrapping (Current)
Explicit `getContext()` before LLM call, inject into prompt string.

**Pros:** Full control, clear what's happening  
**Cons:** Manual prompt engineering to integrate context

### Approach B: SDK Adapter (Investigate)
```typescript
import { wrapModel } from '@mubit/vercel-ai';

const model = wrapModel(anthropic('claude-sonnet-4.5'), {
  namespace: `creator:${creatorId}`,
  mubitClient
});

// Context injected automatically
const { output } = await generateText({ model, ... });
```

**Pros:** Less boilerplate, automatic context injection  
**Cons:** Less control over prompt structure, assumes adapter exists

**Decision:** Start with Approach A (manual), migrate to Approach B if adapter is stable.

---

## Defensive Programming Patterns

### Pattern 1: Optional Dependency
```typescript
// lib/mubit.ts
let _client: MubitClient | null = null;

export function getMubitClient(): MubitClient | null {
  if (!process.env.MUBIT_API_KEY) return null;
  if (!_client) _client = new MubitClient({ apiKey: process.env.MUBIT_API_KEY });
  return _client;
}

export async function getContextSafe(opts: GetContextOpts): Promise<string> {
  const client = getMubitClient();
  if (!client) return '';
  
  try {
    return await client.getContext(opts);
  } catch (err) {
    console.warn('[mubit] getContext failed, degrading gracefully:', err);
    return '';
  }
}
```

### Pattern 2: Non-Blocking Writes
```typescript
export async function rememberSafe(opts: RememberOpts): Promise<void> {
  const client = getMubitClient();
  if (!client) return;
  
  // Fire-and-forget: don't await, don't block workflow
  client.remember(opts).catch(err => {
    console.warn('[mubit] remember failed (non-blocking):', err);
  });
}
```

### Pattern 3: Timeout Guards
```typescript
export async function getContextSafe(opts: GetContextOpts): Promise<string> {
  const client = getMubitClient();
  if (!client) return '';
  
  try {
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 5000)
    );
    return await Promise.race([client.getContext(opts), timeoutPromise]);
  } catch (err) {
    console.warn('[mubit] getContext timeout/error:', err);
    return '';
  }
}
```

**Result:** Mubit never blocks the critical path. Worst case = memory-less LLM call.

---

## Implementation Checklist

### Phase 1: Workflow Interface (Current Sprint)
- [x] Document integration architecture (this doc)
- [ ] Investigate Vercel AI SDK adapter at https://docs.mubit.ai/sdk/framework-integrations#vercel-ai-sdk
- [ ] Create `lib/mubit.ts` with safe wrappers (`getContextSafe`, `rememberSafe`)
- [ ] Add `MUBIT_API_KEY` to `.env.example`
- [ ] Install `@mubit/sdk` (verify exact package name)
- [ ] Wrap `distilThemes` step with `getContext()` + `remember()`
- [ ] Wrap `rankAgainstProfile` step with `getContext()` + `remember()`
- [ ] Test graceful degradation (unset `MUBIT_API_KEY`, verify workflow succeeds)
- [ ] Test with valid key (verify context injection in prompts)

### Phase 2: Learning Interface (Post-Workflow)
- [ ] Add "mark as useful" button to dashboard theme cards
- [ ] Create `POST /api/feedback` route
- [ ] Call `mubit.reflect()` on feedback submission
- [ ] Test that future runs surface different themes based on feedback

### Phase 3: Stretch (Idea Generation)
- [ ] Add new step: `generateContentIdeas(rankedThemes)` → specific video concepts
- [ ] Memory schema: store generated ideas + creator feedback
- [ ] Dashboard: "idea inbox" UI with accept/reject/edit
- [ ] Mubit: `reflect()` on idea acceptance → learn what formats work

---

## Success Metrics

### Qualitative (Demo)
- Judge runs workflow twice → second run surfaces different themes (anti-repetition works)
- Judge marks theme as useful → third run boosts similar themes (learning works)

### Quantitative (Post-Demo)
- Theme repetition rate: % of themes shown in run N that were in run N-1 (target: <30%)
- Engagement lift: themes with memory context vs without (A/B test if multi-creator)
- Context retrieval latency: median time for `getContext()` (target: <500ms)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Mubit API down during demo | Low | High | Graceful degradation (workflow works without memory) |
| Context retrieval too slow (>2s) | Medium | Medium | 5s timeout guard, degradation to empty context |
| SDK adapter doesn't exist/unstable | Medium | Low | Use manual wrapping (Approach A) |
| Memory doesn't improve ranking quality | Medium | Medium | A/B test, fall back to memory-less if no lift |
| Single-run demo doesn't show value | High | Low | Pre-seed memory with synthetic history for demo |

---

## Open Questions

1. **Exact Vercel AI SDK adapter API?** — Docs exist but need to verify function signatures
2. **Cost per `getContext()` call?** — Not published; need to test with real API key
3. **Pre-seeding strategy for demo?** — Should we `remember()` synthetic history before the live run?
4. **Reflect without feedback loop?** — Can we call `reflect()` on implicit signals (click to view theme details)?

**Next step:** Investigate SDK adapter docs, then implement `lib/mubit.ts` wrapper.
