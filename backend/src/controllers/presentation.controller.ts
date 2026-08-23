import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { Presentation, ISlide, SlideLayout } from '../models/Presentation.model';
import { User } from '../models/User.model';
import { ActivityLog } from '../models/ActivityLog.model';
import {
  createPresentation,
  regenerateSlide as regenerateSlideService,
  rewriteSlideText,
  snapshotVersion,
} from '../services/presentation.service';

export const generatePresentation = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();

  const user = await User.findById(req.user.id);
  if (!user) throw AppError.notFound('User not found');

  if (user.subscription.presentationsGenerated >= user.subscription.presentationsLimit) {
    throw AppError.forbidden(
      `You've reached your plan's limit of ${user.subscription.presentationsLimit} presentations. Please upgrade to continue.`,
    );
  }

  const {
    topic,
    audience,
    language,
    style,
    numSlides,
    theme,
    purpose,
    tone,
    includeImages,
    includeCharts,
  } = req.body;

  const presentation = await createPresentation({
    ownerId: req.user.id,
    topic,
    audience,
    language,
    style,
    numSlides,
    theme,
    purpose,
    tone,
    includeImages,
    includeCharts,
  });

  user.subscription.presentationsGenerated += 1;
  await user.save({ validateBeforeSave: false });

  await ActivityLog.create({
    user: req.user.id,
    action: 'presentation.created',
    metadata: { presentationId: presentation._id, topic },
  });

  res.status(201).json({ success: true, data: { presentation } });
});

export const listPresentations = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { page, limit, search, folder, favorite, sortBy, sortOrder } = req.query as unknown as {
    page: number;
    limit: number;
    search?: string;
    folder?: string;
    favorite?: boolean;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };

  const filter: Record<string, unknown> = { owner: req.user.id };
  if (folder) filter.folder = folder;
  if (favorite !== undefined) filter.isFavorite = favorite;
  if (search) filter.$text = { $search: search };

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Presentation.find(filter)
      .select('-slides.speakerNotes -history')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit),
    Presentation.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      presentations: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});

export const getPresentation = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const presentation = await Presentation.findOne({ _id: req.params.id, owner: req.user.id });
  if (!presentation) throw AppError.notFound('Presentation not found');
  res.status(200).json({ success: true, data: { presentation } });
});

export const updatePresentationMeta = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { title, folder, tags, isFavorite } = req.body;

  const presentation = await Presentation.findOne({ _id: req.params.id, owner: req.user.id });
  if (!presentation) throw AppError.notFound('Presentation not found');

  if (title !== undefined) presentation.title = title;
  if (folder !== undefined) presentation.folder = folder;
  if (tags !== undefined) presentation.tags = tags;
  if (isFavorite !== undefined) presentation.isFavorite = isFavorite;

  await presentation.save();
  res.status(200).json({ success: true, data: { presentation } });
});

export const deletePresentation = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const presentation = await Presentation.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!presentation) throw AppError.notFound('Presentation not found');

  await ActivityLog.create({
    user: req.user.id,
    action: 'presentation.deleted',
    metadata: { presentationId: presentation._id },
  });

  res.status(200).json({ success: true, message: 'Presentation deleted successfully' });
});

export const duplicatePresentation = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const original = await Presentation.findOne({ _id: req.params.id, owner: req.user.id });
  if (!original) throw AppError.notFound('Presentation not found');

  const copy = await Presentation.create({
    owner: req.user.id,
    title: `${original.title} (Copy)`,
    topic: original.topic,
    audience: original.audience,
    language: original.language,
    style: original.style,
    theme: original.theme,
    tone: original.tone,
    purpose: original.purpose,
    numSlides: original.numSlides,
    slides: original.slides,
    status: 'ready',
    aiProvider: original.aiProvider,
  });

  res.status(201).json({ success: true, data: { presentation: copy } });
});

export const updateSlide = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { id, slideId } = req.params;

  const presentation = await Presentation.findOne({ _id: id, owner: req.user.id });
  if (!presentation) throw AppError.notFound('Presentation not found');

  const slide = presentation.slides.find((s) => String(s._id) === slideId);
  if (!slide) throw AppError.notFound('Slide not found');

  snapshotVersion(presentation);

  const { title, subtitle, bullets, bodyText, speakerNotes, imageUrl } = req.body;
  if (title !== undefined) slide.title = title;
  if (subtitle !== undefined) slide.subtitle = subtitle;
  if (bullets !== undefined) slide.bullets = bullets;
  if (bodyText !== undefined) slide.bodyText = bodyText;
  if (speakerNotes !== undefined) slide.speakerNotes = speakerNotes;
  if (imageUrl !== undefined) slide.imageUrl = imageUrl;

  presentation.version += 1;
  await presentation.save();

  res.status(200).json({ success: true, data: { presentation } });
});

export const addSlide = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { afterOrder, layout, title } = req.body as { afterOrder?: number; layout: SlideLayout; title: string };

  const presentation = await Presentation.findOne({ _id: req.params.id, owner: req.user.id });
  if (!presentation) throw AppError.notFound('Presentation not found');

  snapshotVersion(presentation);

  const insertAt = afterOrder ?? presentation.slides.length;
  const newSlide: Partial<ISlide> = {
    order: insertAt + 1,
    layout,
    title,
    bullets: layout === 'bullets' || layout === 'agenda' ? ['New point'] : undefined,
    bodyText: layout === 'content' ? 'New slide content' : undefined,
    speakerNotes: '',
  };

  presentation.slides.forEach((s) => {
    if (s.order > insertAt) s.order += 1;
  });
  presentation.slides.push(newSlide as ISlide);
  presentation.slides.sort((a, b) => a.order - b.order);

  await presentation.save();
  res.status(201).json({ success: true, data: { presentation } });
});

export const deleteSlide = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { id, slideId } = req.params;

  const presentation = await Presentation.findOne({ _id: id, owner: req.user.id });
  if (!presentation) throw AppError.notFound('Presentation not found');

  const index = presentation.slides.findIndex((s) => String(s._id) === slideId);
  if (index === -1) throw AppError.notFound('Slide not found');

  snapshotVersion(presentation);
  presentation.slides.splice(index, 1);
  presentation.slides.forEach((s, i) => {
    s.order = i + 1;
  });

  await presentation.save();
  res.status(200).json({ success: true, data: { presentation } });
});

export const duplicateSlide = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { id, slideId } = req.params;

  const presentation = await Presentation.findOne({ _id: id, owner: req.user.id });
  if (!presentation) throw AppError.notFound('Presentation not found');

  const slide = presentation.slides.find((s) => String(s._id) === slideId);
  if (!slide) throw AppError.notFound('Slide not found');

  const clone = (slide.toObject ? slide.toObject() : { ...slide }) as Record<string, unknown>;
  delete clone._id;
  clone.order = slide.order + 1;

  presentation.slides.forEach((s) => {
    if (s.order > slide.order) s.order += 1;
  });
  presentation.slides.push(clone as unknown as ISlide);
  presentation.slides.sort((a, b) => a.order - b.order);

  await presentation.save();
  res.status(201).json({ success: true, data: { presentation } });
});

export const reorderSlides = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { order } = req.body as { order: string[] };

  const presentation = await Presentation.findOne({ _id: req.params.id, owner: req.user.id });
  if (!presentation) throw AppError.notFound('Presentation not found');

  const slideMap = new Map(presentation.slides.map((s) => [String(s._id), s]));
  if (order.length !== presentation.slides.length || !order.every((id) => slideMap.has(id))) {
    throw AppError.badRequest('Order array must contain exactly the current slide IDs');
  }

  order.forEach((slideId, index) => {
    const slide = slideMap.get(slideId);
    if (slide) slide.order = index + 1;
  });
  presentation.slides.sort((a, b) => a.order - b.order);

  await presentation.save();
  res.status(200).json({ success: true, data: { presentation } });
});

export const regenerateSlide = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const presentation = await regenerateSlideService(req.params.id, req.params.slideId, req.user.id);

  await ActivityLog.create({
    user: req.user.id,
    action: 'slide.regenerated',
    metadata: { presentationId: presentation._id, slideId: req.params.slideId },
  });

  res.status(200).json({ success: true, data: { presentation } });
});

export const rewriteSlide = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { field } = req.query as { field?: 'bodyText' | 'bullets' | 'speakerNotes' };
  const { instruction } = req.body;

  const presentation = await rewriteSlideText(
    req.params.id,
    req.params.slideId,
    field ?? 'bodyText',
    instruction,
    req.user.id,
  );

  res.status(200).json({ success: true, data: { presentation } });
});
