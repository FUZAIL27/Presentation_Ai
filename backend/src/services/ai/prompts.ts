import { GenerationRequest } from './ai.types';

export const SLIDE_LAYOUTS = [
  'title',
  'agenda',
  'content',
  'bullets',
  'twoColumn',
  'image',
  'quote',
  'chart',
  'timeline',
  'swot',
  'comparison',
  'conclusion',
  'thankYou',
] as const;

export const SYSTEM_INSTRUCTION = `You are PresentAI's presentation architect — an expert consultant, copywriter, and
information designer who creates world-class business and educational presentations. You produce structured,
accurate, well-organized slide content. You never fabricate statistics; when numbers are needed for charts and no
real data is given, generate clearly illustrative/representative figures. You write concisely: bullet points are
punchy (max ~14 words), speaker notes are 2-4 helpful sentences, titles are short and specific (not generic like
"Introduction"). You vary slide layouts sensibly for the content instead of repeating "bullets" every time.`;

export function buildGenerationPrompt(req: GenerationRequest): string {
  return `Create a complete presentation as structured JSON.

TOPIC: ${req.topic}
AUDIENCE: ${req.audience}
LANGUAGE: Write all content in ${req.language}
STYLE: ${req.style}
TONE: ${req.tone}
PURPOSE: ${req.purpose}
NUMBER OF SLIDES: exactly ${req.numSlides}
CHARTS ALLOWED: ${req.includeCharts ? 'yes, include 1-2 chart slides with realistic illustrative data where relevant' : 'no'}

STRUCTURE RULES:
- Slide 1 MUST be layout "title" (title + subtitle only, no bullets).
- Slide 2 MUST be layout "agenda" listing the main sections as bullets.
- The second-to-last slide MUST be layout "conclusion" (key takeaways as bullets).
- The last slide MUST be layout "thankYou" (title like "Thank You", subtitle can be a contact/call-to-action line).
- Distribute the remaining slides across a sensible mix of these layouts based on what best fits the content:
  "bullets", "content" (body paragraph), "twoColumn" (2 short columns), "image" (imageQuery describing what
  photo/illustration would fit, plus a short bodyText), "quote" (a relevant illustrative quote + bodyText as
  attribution), "chart" (only if charts allowed), "timeline" (timelineItems), "swot" (strengths/weaknesses/
  opportunities/threats), "comparison" (headers + rows table).
- Every slide must include "speakerNotes" (2-4 sentences of what the presenter should say).
- Every slide except title/thankYou should include an "imageQuery" (2-5 word visual search phrase relevant to
  that slide's content, used to fetch a stock photo) UNLESS layout is "chart", "swot", "comparison", or "timeline".
- Keep bullets to 3-6 items per slide, each under 14 words.

Respond with ONLY valid JSON matching this exact shape, no markdown fences, no commentary:
{
  "title": "string - overall presentation title",
  "slides": [
    {
      "order": 1,
      "layout": "title" | "agenda" | "content" | "bullets" | "twoColumn" | "image" | "quote" | "chart" | "timeline" | "swot" | "comparison" | "conclusion" | "thankYou",
      "title": "string",
      "subtitle": "string (optional)",
      "bullets": ["string", ...] (optional),
      "bodyText": "string (optional)",
      "speakerNotes": "string",
      "imageQuery": "string (optional)",
      "chart": { "type": "bar"|"line"|"pie"|"doughnut", "labels": ["string"], "datasets": [{"label":"string","data":[number]}] } (optional),
      "timelineItems": [{"label":"string","description":"string"}] (optional),
      "swot": {"strengths":["string"],"weaknesses":["string"],"opportunities":["string"],"threats":["string"]} (optional),
      "comparison": {"headers":["string"],"rows":[["string"]]} (optional),
      "columns": [{"heading":"string","text":"string"}] (optional)
    }
  ]
}`;
}

export function buildRewritePrompt(text: string, instruction: string, context?: string): string {
  const instructionMap: Record<string, string> = {
    expand: 'Expand this with more detail and supporting points, roughly double the length.',
    shorten: 'Condense this to its most essential point, roughly half the length.',
    professional: 'Rewrite in a polished, professional business tone.',
    creative: 'Rewrite in a more creative, engaging, vivid tone.',
    technical: 'Rewrite in a precise, technical tone suitable for an expert audience.',
    business: 'Rewrite in a confident, results-oriented business tone.',
    grammar: 'Correct any grammar, spelling, and punctuation errors without changing the meaning or tone.',
  };

  return `${context ? `Context: This text is from a slide about "${context}".\n` : ''}Task: ${
    instructionMap[instruction] ?? instructionMap.professional
  }

Text: """${text}"""

Respond with ONLY the rewritten text, no quotes, no preamble, no explanation.`;
}

export function buildSlideRegenerationPrompt(slideTitle: string, layout: string, topic: string, tone: string): string {
  return `Regenerate the content for ONE slide in a presentation about "${topic}".

Slide title: "${slideTitle}"
Layout: ${layout}
Tone: ${tone}

Produce fresh, improved content for this slide (different wording/angle than before, same layout and topic).
Respond with ONLY valid JSON matching this shape, no markdown fences:
{
  "order": number,
  "layout": "${layout}",
  "title": "string",
  "subtitle": "string (optional)",
  "bullets": ["string"] (optional),
  "bodyText": "string (optional)",
  "speakerNotes": "string",
  "imageQuery": "string (optional)",
  "chart": {...} (optional, only if layout is chart),
  "timelineItems": [...] (optional, only if layout is timeline),
  "swot": {...} (optional, only if layout is swot),
  "comparison": {...} (optional, only if layout is comparison),
  "columns": [...] (optional, only if layout is twoColumn)
}`;
}
