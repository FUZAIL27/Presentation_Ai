import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AIGenerationResult, AIGeneratedSlide, AIProvider, AIProviderError, GenerationRequest } from './ai.types';
import { buildGenerationPrompt, buildRewritePrompt, buildSlideRegenerationPrompt, SYSTEM_INSTRUCTION } from './prompts';

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1].trim();
  return raw.trim();
}

async function callWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const backoffMs = 500 * Math.pow(2, attempt);
        logger.warn(`Gemini call failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${backoffMs}ms`);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }
  throw lastErr;
}

export class GeminiProvider implements AIProvider {
  public readonly name = 'gemini';
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    if (!apiKey) throw new AIProviderError('gemini', 'GEMINI_API_KEY is not configured');
    this.client = new GoogleGenerativeAI(apiKey);
  }

  private getModel(jsonMode: boolean) {
    return this.client.getGenerativeModel({
      model: env.GEMINI_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        maxOutputTokens: 8192,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    });
  }

  async generatePresentation(req: GenerationRequest): Promise<AIGenerationResult> {
    const prompt = buildGenerationPrompt(req);

    try {
      const result = await callWithRetry(async () => {
        const model = this.getModel(true);
        const response = await model.generateContent(prompt);
        const text = response.response.text();
        if (!text) throw new AIProviderError('gemini', 'Empty response from Gemini');
        return text;
      });

      const parsed = JSON.parse(extractJson(result)) as AIGenerationResult;

      if (!parsed.title || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
        throw new AIProviderError('gemini', 'Malformed generation result: missing title or slides');
      }

      parsed.slides = parsed.slides.map((s, i) => ({ ...s, order: s.order ?? i + 1 }));

      return parsed;
    } catch (err) {
      logger.error(`Gemini generatePresentation failed: ${(err as Error).message}`);
      throw new AIProviderError('gemini', 'Failed to generate presentation content', err);
    }
  }

  async rewriteText(text: string, instruction: string, context?: string): Promise<string> {
    const prompt = buildRewritePrompt(text, instruction, context);
    try {
      const result = await callWithRetry(async () => {
        const model = this.getModel(false);
        const response = await model.generateContent(prompt);
        const out = response.response.text();
        if (!out) throw new AIProviderError('gemini', 'Empty rewrite response');
        return out;
      });
      return result.trim().replace(/^["']|["']$/g, '');
    } catch (err) {
      logger.error(`Gemini rewriteText failed: ${(err as Error).message}`);
      throw new AIProviderError('gemini', 'Failed to rewrite text', err);
    }
  }

  async regenerateSlide(slide: AIGeneratedSlide, topic: string, tone: string): Promise<AIGeneratedSlide> {
    const prompt = buildSlideRegenerationPrompt(slide.title, slide.layout, topic, tone);
    try {
      const result = await callWithRetry(async () => {
        const model = this.getModel(true);
        const response = await model.generateContent(prompt);
        const text = response.response.text();
        if (!text) throw new AIProviderError('gemini', 'Empty regeneration response');
        return text;
      });
      const parsed = JSON.parse(extractJson(result)) as AIGeneratedSlide;
      return { ...parsed, order: slide.order, layout: slide.layout };
    } catch (err) {
      logger.error(`Gemini regenerateSlide failed: ${(err as Error).message}`);
      throw new AIProviderError('gemini', 'Failed to regenerate slide', err);
    }
  }
}
