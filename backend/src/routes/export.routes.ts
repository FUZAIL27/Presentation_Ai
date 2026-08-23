import { Router } from 'express';
import { protect } from '../middleware/auth';
import { exportPptx, exportPdf } from '../controllers/export.controller';

const router = Router();

router.use(protect);
router.get('/:id/pptx', exportPptx);
router.get('/:id/pdf', exportPdf);

export default router;
