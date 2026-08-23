import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { Presentation } from '../models/Presentation.model';
import { ActivityLog } from '../models/ActivityLog.model';
import { generatePptxBuffer } from '../services/pptx.service';
import { generatePdfBuffer } from '../services/pdf.service';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'presentation';
}

export const exportPptx = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();

  const presentation = await Presentation.findOne({ _id: req.params.id, owner: req.user.id });
  if (!presentation) throw AppError.notFound('Presentation not found');
  if (presentation.status !== 'ready') throw AppError.badRequest('Presentation is not ready for export yet');

  const buffer = await generatePptxBuffer(presentation);

  presentation.lastExportedAt = new Date();
  await presentation.save({ validateBeforeSave: false });

  await ActivityLog.create({
    user: req.user.id,
    action: 'presentation.exported_pptx',
    metadata: { presentationId: presentation._id },
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  );
  res.setHeader('Content-Disposition', `attachment; filename="${slugify(presentation.title)}.pptx"`);
  res.send(buffer);
});

export const exportPdf = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();

  const presentation = await Presentation.findOne({ _id: req.params.id, owner: req.user.id });
  if (!presentation) throw AppError.notFound('Presentation not found');
  if (presentation.status !== 'ready') throw AppError.badRequest('Presentation is not ready for export yet');

  const buffer = await generatePdfBuffer(presentation);

  presentation.lastExportedAt = new Date();
  await presentation.save({ validateBeforeSave: false });

  await ActivityLog.create({
    user: req.user.id,
    action: 'presentation.exported_pdf',
    metadata: { presentationId: presentation._id },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${slugify(presentation.title)}.pdf"`);
  res.send(buffer);
});
