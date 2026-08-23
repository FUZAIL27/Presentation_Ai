import { z } from 'zod';

export const generatePresentationSchema = z.object({
  body: z.object({
    topic: z.string().trim().min(3, 'Topic must be at least 3 characters').max(300),
    audience: z.string().trim().min(2).max(120).default('General audience'),
    language: z.string().trim().min(2).max(40).default('English'),
    style: z
      .enum(['Professional', 'Creative', 'Minimalist', 'Academic', 'Startup', 'Corporate'])
      .default('Professional'),
    numSlides: z.coerce.number().int().min(3).max(30).default(10),
    theme: z.string().trim().min(2).max(40).default('midnight'),
    purpose: z
      .enum(['Inform', 'Persuade', 'Pitch', 'Educate', 'Report', 'Sell'])
      .default('Inform'),
    tone: z
      .enum(['Professional', 'Creative', 'Technical', 'Business', 'Casual', 'Formal'])
      .default('Professional'),
    includeImages: z.boolean().default(true),
    includeCharts: z.boolean().default(true),
  }),
});

export const updateSlideSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(200).optional(),
    subtitle: z.string().max(300).optional(),
    bullets: z.array(z.string().max(300)).max(12).optional(),
    bodyText: z.string().max(2000).optional(),
    speakerNotes: z.string().max(2000).optional(),
    imageUrl: z.string().url().optional(),
  }),
});

export const rewriteSlideSchema = z.object({
  body: z.object({
    instruction: z
      .enum(['expand', 'shorten', 'professional', 'creative', 'technical', 'business', 'grammar'])
      .default('professional'),
  }),
});

export const reorderSlidesSchema = z.object({
  body: z.object({
    order: z.array(z.string()).min(1),
  }),
});

export const addSlideSchema = z.object({
  body: z.object({
    afterOrder: z.number().int().min(0).optional(),
    layout: z
      .enum([
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
      ])
      .default('bullets'),
    title: z.string().trim().min(1).max(200).default('New Slide'),
  }),
});

export const listPresentationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    search: z.string().optional(),
    folder: z.string().optional(),
    favorite: z.coerce.boolean().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});
