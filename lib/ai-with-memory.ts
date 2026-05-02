/**
 * ai-with-memory.ts
 *
 * Memory-augmented AI client for Claude API calls.
 * Wraps Vercel AI SDK with Mubit's long-term memory middleware.
 *
 * When MUBIT_API_KEY is not configured, this module gracefully degrades
 * to standard Claude API calls without memory augmentation.
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateText, Output } from 'ai';
import type { z } from 'zod';

// Dynamic import for Mubit SDK to handle graceful degradation
let wrapLanguageModel: any = null;
try {
  // Try to import Mubit SDK if it's installed
  const mubitSdk = require('@mubit-ai/ai-sdk');
  wrapLanguageModel = mubitSdk.wrapLanguageModel;
} catch {
  // Mubit SDK not installed or not available - graceful degradation
  wrapLanguageModel = null;
}


/**
 * Generate structured output with Claude, augmented by Mubit's memory layer.
 *
 * This is a simplified API matching generateWithClaude but with memory support.
 * Gracefully degrades to standard Claude calls when Mubit is unavailable.
 *
 * @param opts.system - System prompt
 * @param opts.prompt - User prompt
 * @param opts.schema - Zod schema for structured output
 * @param opts.creatorId - Creator ID for memory namespace
 * @param opts.agentId - Agent ID for memory session (e.g., 'distil', 'rank')
 */
export async function generateWithMemory<T extends z.ZodType>(opts: {
  system: string;
  prompt: string;
  schema: T;
  creatorId: number;
  agentId: string;
}): Promise<z.infer<T>> {
  const { system, prompt, schema, creatorId, agentId } = opts;

  const baseModel = anthropic('claude-sonnet-4-6');
  let model = baseModel;

  // Check if Mubit is available and configured
  const mubitApiKey = process.env.MUBIT_API_KEY;
  if (mubitApiKey && wrapLanguageModel) {
    try {
      // Wrap Claude model with Mubit memory middleware
      model = wrapLanguageModel({
        model: baseModel,
        mubitApiKey,
        userId: `creator-${creatorId}`,
        sessionId: agentId,
      });
      console.log(
        `[ai-with-memory] Using Mubit memory for creator-${creatorId}/${agentId}`
      );
    } catch (error) {
      console.warn(
        '[ai-with-memory] Failed to initialize Mubit, falling back to standard Claude:',
        error
      );
      model = baseModel;
    }
  } else {
    if (!mubitApiKey) {
      console.log(
        '[ai-with-memory] MUBIT_API_KEY not configured, using standard Claude'
      );
    } else {
      console.log(
        '[ai-with-memory] Mubit SDK not available, using standard Claude'
      );
    }
  }

  // Timeout configuration
  const timeoutMs = parseInt(process.env.MUBIT_TIMEOUT_MS || '60000', 10);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`generateWithMemory timeout after ${timeoutMs}ms`)),
      timeoutMs
    )
  );

  // Race the AI call against the timeout
  try {
    const result = await Promise.race([
      generateText({
        model,
        system,
        prompt,
        output: Output.object({ schema }),
      }),
      timeoutPromise,
    ]);

    return result.output;
  } catch (error) {
    console.error('[ai-with-memory] Error during generateWithMemory:', error);
    throw error;
  }
}
