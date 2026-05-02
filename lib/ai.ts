import { anthropic } from '@ai-sdk/anthropic';
import { generateText, Output } from 'ai';
import { z } from 'zod';

const MODEL = 'claude-sonnet-4.5-20250514';

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set');
  return key;
}

export async function generateWithClaude<T extends z.ZodType>(opts: {
  system: string;
  prompt: string;
  schema: T;
}): Promise<z.infer<T>> {
  getApiKey(); // validates key exists

  const { output } = await generateText({
    model: anthropic(MODEL),
    system: opts.system,
    prompt: opts.prompt,
    output: Output.object({ schema: opts.schema }),
  });

  return output;
}
