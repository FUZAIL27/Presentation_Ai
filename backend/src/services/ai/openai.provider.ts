import { logger } from '../../config/logger';
import { AIGenerationResult, AIGeneratedSlide, AIProvider, AIProviderError, GenerationRequest } from './ai.types';
import { buildGenerationPrompt, buildRewritePrompt, buildSlideRegenerationPrompt, SYSTEM_INSTRUCTION } from './prompts';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';

interface OpenAIChatResponse {
  choices: { message: { content: string } }[];
}

export class OpenAIProvider implements AIProvider {
  public readonly name = 'openai';

  constructor(
    private apiKey: string,
    private model: string = DEFAULT_MODEL,
  ) {
    if (!apiKey) throw new AIProviderError('openai', 'OPENAI_API_KEY is not configured');
  }

  private async chat(userPrompt: string, jsonMode: boolean): Promise<string> {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.8,
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: userPrompt },
        ],
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new AIProviderError('openai', `OpenAI API error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as OpenAIChatResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new AIProviderError('openai', 'Empty response from OpenAI');
    return content;
  }

  async generatePresentation(req: GenerationRequest): Promise<AIGenerationResult> {
    try {
      const raw = await this.chat(buildGenerationPrompt(req), true);
      const parsed = JSON.parse(raw) as AIGenerationResult;
      if (!parsed.title || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
        throw new AIProviderError('openai', 'Malformed generation result');
      }
      parsed.slides = parsed.slides.map((s, i) => ({ ...s, order: s.order ?? i + 1 }));
      return parsed;
    } catch (err) {
      logger.error(`OpenAI generatePresentation failed: ${(err as Error).message}`);
      throw new AIProviderError('openai', 'Failed to generate presentation content', err);
    }
  }

  async rewriteText(text: string, instruction: string, context?: string): Promise<string> {
    try {
      const out = await this.chat(buildRewritePrompt(text, instruction, context), false);
      return out.trim().replace(/^["']|["']$/g, '');
    } catch (err) {
      logger.error(`OpenAI rewriteText failed: ${(err as Error).message}`);
      throw new AIProviderError('openai', 'Failed to rewrite text', err);
    }
  }

  async regenerateSlide(slide: AIGeneratedSlide, topic: string, tone: string): Promise<AIGeneratedSlide> {
    try {
      const raw = await this.chat(buildSlideRegenerationPrompt(slide.title, slide.layout, topic, tone), true);
      const parsed = JSON.parse(raw) as AIGeneratedSlide;
      return { ...parsed, order: slide.order, layout: slide.layout };
    } catch (err) {
      logger.error(`OpenAI regenerateSlide failed: ${(err as Error).message}`);
      throw new AIProviderError('openai', 'Failed to regenerate slide', err);
    }
  }
}
