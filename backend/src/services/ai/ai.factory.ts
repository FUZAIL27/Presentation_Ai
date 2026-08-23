import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AIProvider, AIProviderError } from './ai.types';
import { GeminiProvider } from './gemini.provider';
import { OpenAIProvider } from './openai.provider';
import { ClaudeProvider } from './claude.provider';

function buildProviderChain(): AIProvider[] {
  const chain: AIProvider[] = [];
  const order: Array<'gemini' | 'openai' | 'claude'> =
    env.AI_PROVIDER === 'gemini'
      ? ['gemini', 'openai', 'claude']
      : env.AI_PROVIDER === 'openai'
        ? ['openai', 'gemini', 'claude']
        : ['claude', 'gemini', 'openai'];

  for (const p of order) {
    try {
      if (p === 'gemini' && env.GEMINI_API_KEY) chain.push(new GeminiProvider(env.GEMINI_API_KEY));
      if (p === 'openai' && env.OPENAI_API_KEY) chain.push(new OpenAIProvider(env.OPENAI_API_KEY));
      if (p === 'claude' && env.ANTHROPIC_API_KEY) chain.push(new ClaudeProvider(env.ANTHROPIC_API_KEY));
    } catch (err) {
      logger.warn(`Skipping AI provider "${p}": ${(err as Error).message}`);
    }
  }

  if (chain.length === 0) {
    throw new Error('No AI providers are configured. Set at least GEMINI_API_KEY in .env');
  }

  return chain;
}

let providerChain: AIProvider[] | null = null;

function getChain(): AIProvider[] {
  if (!providerChain) providerChain = buildProviderChain();
  return providerChain;
}

/**
 * Runs `operation` against the primary AI provider, automatically falling back
 * to the next configured provider if the primary fails (rate limit, outage, malformed output).
 */
export async function withAIFallback<T>(operation: (provider: AIProvider) => Promise<T>): Promise<T> {
  const chain = getChain();
  let lastError: unknown;

  for (const provider of chain) {
    try {
      return await operation(provider);
    } catch (err) {
      lastError = err;
      logger.warn(
        `AI provider "${provider.name}" failed, ${
          chain.indexOf(provider) < chain.length - 1 ? 'falling back to next provider' : 'no providers left'
        }: ${(err as Error).message}`,
      );
    }
  }

  throw new AIProviderError(
    'all',
    'All configured AI providers failed to fulfill the request',
    lastError,
  );
}

export function getPrimaryProviderName(): string {
  return getChain()[0].name;
}
