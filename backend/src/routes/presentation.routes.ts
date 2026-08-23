import { Router } from 'express';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { generationLimiter } from '../middleware/rateLimiter';
import {
  generatePresentationSchema,
  updateSlideSchema,
  rewriteSlideSchema,
  reorderSlidesSchema,
  addSlideSchema,
  listPresentationsSchema,
} from '../validators/presentation.validator';
import {
  generatePresentation,
  listPresentations,
  getPresentation,
  updatePresentationMeta,
  deletePresentation,
  duplicatePresentation,
  updateSlide,
  addSlide,
  deleteSlide,
  duplicateSlide,
  reorderSlides,
  regenerateSlide,
  rewriteSlide,
} from '../controllers/presentation.controller';

const router = Router();

router.use(protect);

router.post('/generate', generationLimiter, validate(generatePresentationSchema), generatePresentation);
router.get('/', validate(listPresentationsSchema), listPresentations);
router.get('/:id', getPresentation);
router.patch('/:id', updatePresentationMeta);
router.delete('/:id', deletePresentation);
router.post('/:id/duplicate', duplicatePresentation);
router.post('/:id/reorder', validate(reorderSlidesSchema), reorderSlides);

router.post('/:id/slides', validate(addSlideSchema), addSlide);
router.patch('/:id/slides/:slideId', validate(updateSlideSchema), updateSlide);
router.delete('/:id/slides/:slideId', deleteSlide);
router.post('/:id/slides/:slideId/duplicate', duplicateSlide);
router.post('/:id/slides/:slideId/regenerate', generationLimiter, regenerateSlide);
router.post('/:id/slides/:slideId/rewrite', generationLimiter, validate(rewriteSlideSchema), rewriteSlide);

export default router;
