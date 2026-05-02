import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const MODEL = 'claude-sonnet-4.5-20250514';

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set');
  return key;
}

export async function generateWithClaude(opts: {
  system: string;
  prompt: string;
}): Promise<string> {
  getApiKey(); // validates key exists

  const { text } = await generateText({
    model: anthropic(MODEL),
    system: opts.system,
    prompt: opts.prompt,
  });

  return text;
}
