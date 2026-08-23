import { logger } from '../../config/logger';
import { AIGenerationResult, AIGeneratedSlide, AIProvider, AIProviderError, GenerationRequest } from './ai.types';
import { buildGenerationPrompt, buildRewritePrompt, buildSlideRegenerationPrompt, SYSTEM_INSTRUCTION } from './prompts';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-5';
const ANTHROPIC_VERSION = '2023-06-01';

interface AnthropicResponse {
  content: { type: string; text?: string }[];
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1].trim();
  return raw.trim();
}

export class ClaudeProvider implements AIProvider {
  public readonly name = 'claude';

  constructor(
    private apiKey: string,
    private model: string = DEFAULT_MODEL,
  ) {
    if (!apiKey) throw new AIProviderError('claude', 'ANTHROPIC_API_KEY is not configured');
  }

  private async complete(userPrompt: string): Promise<string> {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 8192,
        temperature: 0.8,
        system: SYSTEM_INSTRUCTION,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new AIProviderError('claude', `Anthropic API error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as AnthropicResponse;
    const text = data.content?.find((b) => b.type === 'text')?.text;
    if (!text) throw new AIProviderError('claude', 'Empty response from Claude');
    return text;
  }

  async generatePresentation(req: GenerationRequest): Promise<AIGenerationResult> {
    try {
      const raw = await this.complete(buildGenerationPrompt(req));
      const parsed = JSON.parse(extractJson(raw)) as AIGenerationResult;
      if (!parsed.title || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
        throw new AIProviderError('claude', 'Malformed generation result');
      }
      parsed.slides = parsed.slides.map((s, i) => ({ ...s, order: s.order ?? i + 1 }));
      return parsed;
    } catch (err) {
      logger.error(`Claude generatePresentation failed: ${(err as Error).message}`);
      throw new AIProviderError('claude', 'Failed to generate presentation content', err);
    }
  }

  async rewriteText(text: string, instruction: string, context?: string): Promise<string> {
    try {
      const out = await this.complete(buildRewritePrompt(text, instruction, context));
      return out.trim().replace(/^["']|["']$/g, '');
    } catch (err) {
      logger.error(`Claude rewriteText failed: ${(err as Error).message}`);
      throw new AIProviderError('claude', 'Failed to rewrite text', err);
    }
  }

  async regenerateSlide(slide: AIGeneratedSlide, topic: string, tone: string): Promise<AIGeneratedSlide> {
    try {
      const raw = await this.complete(buildSlideRegenerationPrompt(slide.title, slide.layout, topic, tone));
      const parsed = JSON.parse(extractJson(raw)) as AIGeneratedSlide;
      return { ...parsed, order: slide.order, layout: slide.layout };
    } catch (err) {
      logger.error(`Claude regenerateSlide failed: ${(err as Error).message}`);
      throw new AIProviderError('claude', 'Failed to regenerate slide', err);
    }
  }
}
