import { Types } from 'mongoose';
import { Presentation, IPresentation, ISlide } from '../models/Presentation.model';
import { withAIFallback, getPrimaryProviderName } from './ai/ai.factory';
import { fetchImagesForQueries } from './image.service';
import { AIGeneratedSlide } from './ai/ai.types';
import { AppError } from '../utils/AppError';

export interface CreatePresentationInput {
  ownerId: string;
  topic: string;
  audience: string;
  language: string;
  style: string;
  numSlides: number;
  theme: string;
  purpose: string;
  tone: string;
  includeImages: boolean;
  includeCharts: boolean;
}

function toSlideDocs(slides: AIGeneratedSlide[], imageMap: Map<string, string | null>): Partial<ISlide>[] {
  return slides.map((s) => ({
    order: s.order,
    layout: s.layout as ISlide['layout'],
    title: s.title,
    subtitle: s.subtitle,
    bullets: s.bullets,
    bodyText: s.bodyText,
    speakerNotes: s.speakerNotes,
    imageQuery: s.imageQuery,
    imageUrl: s.imageQuery ? (imageMap.get(s.imageQuery) ?? undefined) : undefined,
    chart: s.chart,
    timelineItems: s.timelineItems,
    swot: s.swot,
    comparison: s.comparison,
    columns: s.columns,
  }));
}

export async function createPresentation(input: CreatePresentationInput): Promise<IPresentation> {
  const draft = await Presentation.create({
    owner: new Types.ObjectId(input.ownerId),
    title: input.topic,
    topic: input.topic,
    audience: input.audience,
    language: input.language,
    style: input.style,
    theme: input.theme,
    tone: input.tone,
    purpose: input.purpose,
    numSlides: input.numSlides,
    slides: [],
    status: 'generating',
    aiProvider: getPrimaryProviderName(),
  });

  try {
    const result = await withAIFallback((provider) =>
      provider.generatePresentation({
        topic: input.topic,
        audience: input.audience,
        language: input.language,
        style: input.style,
        numSlides: input.numSlides,
        purpose: input.purpose,
        tone: input.tone,
        includeCharts: input.includeCharts,
      }),
    );

    let imageMap = new Map<string, string | null>();
    if (input.includeImages) {
      const queries = result.slides.map((s) => s.imageQuery).filter((q): q is string => !!q);
      imageMap = await fetchImagesForQueries(queries);
    }

    draft.title = result.title;
    draft.slides = toSlideDocs(result.slides, imageMap) as ISlide[];
    draft.status = 'ready';
    await draft.save();

    return draft;
  } catch (err) {
    draft.status = 'failed';
    await draft.save();
    throw AppError.internal(
      `Failed to generate presentation: ${(err as Error).message}. You can retry generation on this draft.`,
    );
  }
}

export async function regenerateSlide(
  presentationId: string,
  slideId: string,
  ownerId: string,
): Promise<IPresentation> {
  const presentation = await Presentation.findOne({ _id: presentationId, owner: ownerId });
  if (!presentation) throw AppError.notFound('Presentation not found');

  const slide = presentation.slides.find((s) => String(s._id) === slideId);
  if (!slide) throw AppError.notFound('Slide not found');

  const regenerated = await withAIFallback((provider) =>
    provider.regenerateSlide(
      {
        order: slide.order,
        layout: slide.layout,
        title: slide.title,
        subtitle: slide.subtitle,
        bullets: slide.bullets,
        bodyText: slide.bodyText,
        speakerNotes: slide.speakerNotes,
        imageQuery: slide.imageQuery,
        chart: slide.chart,
        timelineItems: slide.timelineItems,
        swot: slide.swot,
        comparison: slide.comparison,
        columns: slide.columns,
      },
      presentation.topic,
      presentation.tone,
    ),
  );

  let imageUrl = slide.imageUrl;
  if (regenerated.imageQuery && regenerated.imageQuery !== slide.imageQuery) {
    const imageMap = await fetchImagesForQueries([regenerated.imageQuery]);
    imageUrl = imageMap.get(regenerated.imageQuery) ?? imageUrl;
  }

  slide.title = regenerated.title;
  slide.subtitle = regenerated.subtitle;
  slide.bullets = regenerated.bullets;
  slide.bodyText = regenerated.bodyText;
  slide.speakerNotes = regenerated.speakerNotes;
  slide.imageQuery = regenerated.imageQuery;
  slide.imageUrl = imageUrl;
  slide.chart = regenerated.chart;
  slide.timelineItems = regenerated.timelineItems;
  slide.swot = regenerated.swot;
  slide.comparison = regenerated.comparison;
  slide.columns = regenerated.columns;

  presentation.version += 1;
  await presentation.save();
  return presentation;
}

export async function rewriteSlideText(
  presentationId: string,
  slideId: string,
  field: 'bodyText' | 'bullets' | 'speakerNotes',
  instruction: string,
  ownerId: string,
): Promise<IPresentation> {
  const presentation = await Presentation.findOne({ _id: presentationId, owner: ownerId });
  if (!presentation) throw AppError.notFound('Presentation not found');

  const slide = presentation.slides.find((s) => String(s._id) === slideId);
  if (!slide) throw AppError.notFound('Slide not found');

  if (field === 'bullets') {
    if (!slide.bullets || slide.bullets.length === 0) {
      throw AppError.badRequest('This slide has no bullet content to rewrite');
    }
    const combined = slide.bullets.join('\n');
    const rewritten = await withAIFallback((provider) => provider.rewriteText(combined, instruction, slide.title));
    slide.bullets = rewritten
      .split('\n')
      .map((b) => b.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);
  } else {
    const original = slide[field] ?? '';
    if (!original) throw AppError.badRequest(`This slide has no ${field} to rewrite`);
    slide[field] = await withAIFallback((provider) => provider.rewriteText(original, instruction, slide.title));
  }

  presentation.version += 1;
  await presentation.save();
  return presentation;
}

export function snapshotVersion(presentation: IPresentation): void {
  presentation.history.push({
    version: presentation.version,
    slides: presentation.slides,
    savedAt: new Date(),
  });
  if (presentation.history.length > 20) {
    presentation.history = presentation.history.slice(-20);
  }
}
