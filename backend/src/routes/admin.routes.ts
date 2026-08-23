import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth';
import {
  listUsers,
  updateUserRole,
  updateUserSubscription,
  deactivateUser,
  getAnalytics,
  getSystemHealth,
} from '../controllers/admin.controller';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/users', listUsers);
router.patch('/users/:userId/role', updateUserRole);
router.patch('/users/:userId/subscription', updateUserSubscription);
router.patch('/users/:userId/deactivate', deactivateUser);
router.get('/analytics', getAnalytics);
router.get('/system-health', getSystemHealth);

export default router;
