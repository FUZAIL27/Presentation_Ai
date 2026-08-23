import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import presentationRoutes from './presentation.routes';
import exportRoutes from './export.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'PresentAI API is healthy', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/presentations', presentationRoutes);
router.use('/export', exportRoutes);
router.use('/admin', adminRoutes);

export default router;
