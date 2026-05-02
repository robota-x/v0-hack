import type { FollowList, RawProfile, RawHashtagFeed, RawPost } from '@/lib/types';
import { triggerScrape, downloadSnapshot } from '@/lib/brightdata';

// BrightData API response shapes (snake_case)
interface BdPost {
  shortcode?: string;
  caption?: string;
  likes_count?: number;
  video_view_count?: number;
  is_video?: boolean;
  owner?: { username?: string };
  timestamp?: string;
}

interface BdProfile {
  username?: string;
  followers_count?: number;
  posts_count?: number;
  recent_posts?: BdPost[];
}

interface BdHashtagFeed {
  hashtag?: string;
  media_count?: number;
  top_posts?: BdPost[];
}

function mapPost(p: BdPost): RawPost {
  return {
    shortcode: p.shortcode ?? '',
    caption: p.caption ?? '',
    likesCount: p.likes_count ?? 0,
    videoViewCount: p.video_view_count ?? 0,
    isVideo: p.is_video ?? false,
    ownerUsername: p.owner?.username ?? '',
    timestamp: p.timestamp ?? new Date().toISOString(),
  };
}

function appBaseUrl(): string {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
}

export async function triggerInstagramScrapes(
  followList: FollowList,
): Promise<{ profileSnapshotId: string; hashtagSnapshotId: string }> {
  'use step';

  // Use mock mode if BRIGHTDATA_MOCK is set, otherwise use real BrightData
  const useMock = process.env.BRIGHTDATA_MOCK === 'true';

  if (useMock) {
    console.log(
      `[triggerInstagramScrapes] MOCK MODE — generating fake data for ${followList.accounts.length} profiles ` +
        `(${followList.accounts.join(', ')}) + ${followList.hashtags.length} hashtags ` +
        `(${followList.hashtags.map((h) => '#' + h).join(', ')})`,
    );

    // Mock: return fake snapshot IDs immediately
    const profileSnapshotId = `mock_profiles_${Date.now()}`;
    const hashtagSnapshotId = `mock_hashtags_${Date.now()}`;

    console.log(
      `[triggerInstagramScrapes] MOCK — returning fake IDs: profileSnapshotId=${profileSnapshotId} hashtagSnapshotId=${hashtagSnapshotId}`,
    );

    return { profileSnapshotId, hashtagSnapshotId };
  }

  // Real BrightData flow
  const notifyUrl = `${appBaseUrl()}/api/hooks/brightdata`;
  const collectorId = process.env.BRIGHTDATA_COLLECTOR_ID || 'gd_l1vikfch901nx3by4';

  console.log(
    `[triggerInstagramScrapes] firing BrightData collector=${collectorId} for ${followList.accounts.length} profiles ` +
      `(${followList.accounts.join(', ')}) + ${followList.hashtags.length} hashtags ` +
      `(${followList.hashtags.map((h) => '#' + h).join(', ')}) — notify: ${notifyUrl}`,
  );

  const [profileSnapshotId, hashtagSnapshotId] = await Promise.all([
    triggerScrape({
      collector: collectorId,
      inputs: followList.accounts.map((u) => ({
        url: `https://www.instagram.com/${u}/`,
      })),
      notifyUrl,
    }),
    triggerScrape({
      collector: collectorId,
      inputs: followList.hashtags.map((h) => ({ hashtag: h })),
      limitPerInput: 50,
      notifyUrl,
    }),
  ]);

  console.log(
    `[triggerInstagramScrapes] triggered — profileSnapshotId=${profileSnapshotId} hashtagSnapshotId=${hashtagSnapshotId}`,
  );

  return { profileSnapshotId, hashtagSnapshotId };
}

export async function downloadInstagramProfiles(snapshotId: string): Promise<RawProfile[]> {
  'use step';

  // Check if using mock mode
  if (snapshotId.startsWith('mock_')) {
    console.log(`[downloadInstagramProfiles] MOCK MODE — returning fake profile data for snapshot=${snapshotId}`);

  // Mock data: AI/agentic development themed profiles (expanded)
  return [
    {
      username: 'ai_agents_daily',
      followersCount: 127500,
      postsCount: 342,
      recentPosts: [
        {
          shortcode: 'mock_001',
          caption: 'New LangChain v0.3 just dropped 🔥 Multi-agent orchestration is finally production-ready. Who else is building with this? #aiagents #langchain',
          likesCount: 2840,
          videoViewCount: 0,
          isVideo: false,
          ownerUsername: 'ai_agents_daily',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          shortcode: 'mock_002',
          caption: 'Building an autonomous code review agent that actually understands your codebase. Using Claude + vector DB for context. Ship date: next week 🚀 #agentic #codingai',
          likesCount: 3120,
          videoViewCount: 8500,
          isVideo: true,
          ownerUsername: 'ai_agents_daily',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          shortcode: 'mock_003',
          caption: 'RAG is dead, long live agentic retrieval! Instead of dumb vector search, let agents decide what context they need and go fetch it. Game changer for accuracy. #aiagents #rag',
          likesCount: 4920,
          videoViewCount: 0,
          isVideo: false,
          ownerUsername: 'ai_agents_daily',
          timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    {
      username: 'vibe_coding',
      followersCount: 89300,
      postsCount: 218,
      recentPosts: [
        {
          shortcode: 'mock_004',
          caption: 'POV: you discover cursor composer can refactor your entire codebase while you make coffee ☕️ #vibecoding #aidev',
          likesCount: 5230,
          videoViewCount: 18400,
          isVideo: true,
          ownerUsername: 'vibe_coding',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        },
        {
          shortcode: 'mock_005',
          caption: 'The future of coding is just vibing with AI. No more fighting syntax errors at 2am. Just describe what you want and let Claude cook 🍳 #aiassisted #developerlife',
          likesCount: 4180,
          videoViewCount: 0,
          isVideo: false,
          ownerUsername: 'vibe_coding',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    {
      username: 'prompt_engineering_lab',
      followersCount: 203400,
      postsCount: 567,
      recentPosts: [
        {
          shortcode: 'mock_006',
          caption: 'System prompt archaeology: dug into Claude\'s system prompt and found the golden patterns. Thread on what makes a prompt "production-ready" 🧵 #promptengineering #llmops',
          likesCount: 8340,
          videoViewCount: 0,
          isVideo: false,
          ownerUsername: 'prompt_engineering_lab',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        },
        {
          shortcode: 'mock_007',
          caption: 'Hot take: your prompts are too long. The best production prompts I\'ve seen are <100 tokens. Show examples, not instructions. #promptengineering #aidev',
          likesCount: 6720,
          videoViewCount: 21300,
          isVideo: true,
          ownerUsername: 'prompt_engineering_lab',
          timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
        },
        {
          shortcode: 'mock_008',
          caption: 'Prompt caching just saved us $12k/month. If you\'re not caching your system prompts in 2026, you\'re leaving money on the table. Here\'s our setup 💰 #llmops #optimization',
          likesCount: 9240,
          videoViewCount: 0,
          isVideo: false,
          ownerUsername: 'prompt_engineering_lab',
          timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    {
      username: 'indie_ai_builders',
      followersCount: 156700,
      postsCount: 423,
      recentPosts: [
        {
          shortcode: 'mock_009',
          caption: 'Shipped my AI SaaS from 0 to $10k MRR in 6 weeks. No team, no funding. Just Cursor + Claude + Vercel. The indie hacker playbook is changing fast. #indiehacker #aisolopreneur',
          likesCount: 12400,
          videoViewCount: 38900,
          isVideo: true,
          ownerUsername: 'indie_ai_builders',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          shortcode: 'mock_010',
          caption: 'Stop building AI wrappers. Build AI-native products. What\'s the difference? One uses AI as a feature, the other couldn\'t exist without it. Thread 🧵 #aiproducts #startups',
          likesCount: 7830,
          videoViewCount: 0,
          isVideo: false,
          ownerUsername: 'indie_ai_builders',
          timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    {
      username: 'devtools_ai',
      followersCount: 94200,
      postsCount: 289,
      recentPosts: [
        {
          shortcode: 'mock_011',
          caption: 'The AI IDE wars are heating up: Cursor vs Windsurf vs Zed. We benchmarked all three on real codebases. Results might surprise you 📊 #aidevtools #cursor',
          likesCount: 5940,
          videoViewCount: 15700,
          isVideo: true,
          ownerUsername: 'devtools_ai',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        },
        {
          shortcode: 'mock_012',
          caption: 'GitHub Copilot just added multi-file editing. Cursor had it first, but this changes the game for enterprise teams. Competition is good for us all 🙌 #copilot #aitools',
          likesCount: 4320,
          videoViewCount: 0,
          isVideo: false,
          ownerUsername: 'devtools_ai',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
  ];
  }

  // Real BrightData flow
  console.log(`[downloadInstagramProfiles] downloading snapshot=${snapshotId}`);
  const raw = await downloadSnapshot<BdProfile>(snapshotId);

  return raw.map((p) => ({
    username: p.username ?? '',
    followersCount: p.followers_count ?? 0,
    postsCount: p.posts_count ?? 0,
    recentPosts: (p.recent_posts ?? []).map(mapPost),
  }));
}

export async function downloadInstagramHashtags(snapshotId: string): Promise<RawHashtagFeed[]> {
  'use step';

  // Check if using mock mode
  if (snapshotId.startsWith('mock_')) {
    console.log(`[downloadInstagramHashtags] MOCK MODE — returning fake hashtag data for snapshot=${snapshotId}`);

  // Mock data: AI/agentic development themed hashtags (expanded)
  return [
    {
      hashtag: 'aiagents',
      mediaCount: 48200,
      topPosts: [
        {
          shortcode: 'mock_h001',
          caption: 'Just shipped my first autonomous agent that handles customer support 24/7. No human intervention needed. RAG + function calling + persistent memory = magic ✨ #aiagents #automation',
          likesCount: 6420,
          videoViewCount: 0,
          isVideo: false,
          ownerUsername: 'agent_builders',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          shortcode: 'mock_h002',
          caption: 'Demo: AI agent that reads PRs, runs tests, and writes thoughtful code reviews. Built with Claude API + GitHub webhooks. Link in bio 🔗 #aiagents #devtools',
          likesCount: 8930,
          videoViewCount: 24100,
          isVideo: true,
          ownerUsername: 'code_automation',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        },
        {
          shortcode: 'mock_h003',
          caption: 'Stop writing CRUD APIs. Let agents do it. I built an agent that generates + deploys production-ready APIs from plain English. Open source soon 👀 #aiagents #codegen',
          likesCount: 7240,
          videoViewCount: 19800,
          isVideo: true,
          ownerUsername: 'ai_dev_tools',
          timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        },
        {
          shortcode: 'mock_h004',
          caption: 'Agentic workflows are replacing traditional automation. Instead of rigid if-then rules, agents adapt and reason. Seeing 10x better results on complex tasks. #aiagents #workflows',
          likesCount: 5840,
          videoViewCount: 0,
          isVideo: false,
          ownerUsername: 'workflow_automation',
          timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    {
      hashtag: 'agenticai',
      mediaCount: 31500,
      topPosts: [
        {
          shortcode: 'mock_h005',
          caption: 'The agentic AI landscape is evolving fast. LangGraph, AutoGPT, and CrewAI are all converging on the same pattern: tool use + memory + planning. Which stack are you betting on? #agenticai',
          likesCount: 4820,
          videoViewCount: 0,
          isVideo: false,
          ownerUsername: 'ai_research_weekly',
          timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
        },
        {
          shortcode: 'mock_h006',
          caption: 'Built a swarm of specialized agents: one for research, one for coding, one for testing. They coordinate via shared memory. Productivity up 10x 📈 #agenticai #aiworkflow',
          likesCount: 5930,
          videoViewCount: 16200,
          isVideo: true,
          ownerUsername: 'agent_swarms',
          timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
        },
        {
          shortcode: 'mock_h007',
          caption: 'Agentic AI vs traditional AI: one can adapt and plan, the other just predicts next tokens. The gap is widening and it\'s not even close anymore. #agenticai #llm',
          likesCount: 6140,
          videoViewCount: 0,
          isVideo: false,
          ownerUsername: 'ai_explained',
          timestamp: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    {
      hashtag: 'promptengineering',
      mediaCount: 67800,
      topPosts: [
        {
          shortcode: 'mock_h008',
          caption: 'Prompt engineering is becoming a real skill. Not just "be nice to the AI" - it\'s about understanding token probabilities, context windows, and model behavior. #promptengineering #aidev',
          likesCount: 9240,
          videoViewCount: 0,
          isVideo: false,
          ownerUsername: 'prompt_masters',
          timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
        },
        {
          shortcode: 'mock_h009',
          caption: 'My prompt template that took us from 60% to 95% accuracy. It\'s all about examples and constraints. Stop writing essays, start showing examples. #promptengineering #llmops',
          likesCount: 11200,
          videoViewCount: 29400,
          isVideo: true,
          ownerUsername: 'ai_optimization',
          timestamp: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
        },
        {
          shortcode: 'mock_h010',
          caption: 'Few-shot prompting is underrated. Instead of explaining the task in detail, just show 3-4 examples. The model gets it immediately. #promptengineering #fewshot',
          likesCount: 7630,
          videoViewCount: 0,
          isVideo: false,
          ownerUsername: 'ml_techniques',
          timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    {
      hashtag: 'indiehackers',
      mediaCount: 124300,
      topPosts: [
        {
          shortcode: 'mock_h011',
          caption: 'Solo founder update: $15k MRR with AI tools I built in 3 months. No VC, no team, just me + Claude + caffeine. The barrier to entry is GONE. #indiehackers #solopreneur',
          likesCount: 14800,
          videoViewCount: 42100,
          isVideo: true,
          ownerUsername: 'solo_saas',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          shortcode: 'mock_h012',
          caption: 'The new indie hacker stack: Cursor for code, Claude for content, Vercel for hosting, Stripe for payments. Ship faster than ever before. #indiehackers #aitools',
          likesCount: 8940,
          videoViewCount: 0,
          isVideo: false,
          ownerUsername: 'bootstrap_stories',
          timestamp: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
        },
        {
          shortcode: 'mock_h013',
          caption: 'Controversial take: AI makes indie hacking EASIER, not harder. Yes, there\'s more competition, but you can also build 10x faster. Speed wins. #indiehackers #startups',
          likesCount: 10300,
          videoViewCount: 0,
          isVideo: false,
          ownerUsername: 'indie_insights',
          timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
  ];
  }

  // Real BrightData flow
  console.log(`[downloadInstagramHashtags] downloading snapshot=${snapshotId}`);
  const raw = await downloadSnapshot<BdHashtagFeed>(snapshotId);

  return raw.map((f) => ({
    hashtag: f.hashtag ?? '',
    mediaCount: f.media_count ?? 0,
    topPosts: (f.top_posts ?? []).map(mapPost),
  }));
}
