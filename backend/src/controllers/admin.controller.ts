import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { User } from '../models/User.model';
import { Presentation } from '../models/Presentation.model';
import { ActivityLog } from '../models/ActivityLog.model';

export const listUsers = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const search = req.query.search as string | undefined;

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email role subscription isEmailVerified active createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
});

export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.body as { role: 'user' | 'admin' };
  if (!['user', 'admin'].includes(role)) throw AppError.badRequest('Invalid role');

  const user = await User.findByIdAndUpdate(req.params.userId, { role }, { new: true });
  if (!user) throw AppError.notFound('User not found');

  res.status(200).json({ success: true, data: { user } });
});

export const updateUserSubscription = catchAsync(async (req: Request, res: Response) => {
  const { plan, presentationsLimit } = req.body as { plan?: string; presentationsLimit?: number };

  const user = await User.findById(req.params.userId);
  if (!user) throw AppError.notFound('User not found');

  if (plan) user.subscription.plan = plan as typeof user.subscription.plan;
  if (presentationsLimit !== undefined) user.subscription.presentationsLimit = presentationsLimit;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: { user } });
});

export const deactivateUser = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.userId, { active: false }, { new: true });
  if (!user) throw AppError.notFound('User not found');
  res.status(200).json({ success: true, message: 'User deactivated' });
});

export const getAnalytics = catchAsync(async (_req: Request, res: Response) => {
  const [totalUsers, totalPresentations, verifiedUsers, presentationsByStatus, recentActivity] = await Promise.all([
    User.countDocuments(),
    Presentation.countDocuments(),
    User.countDocuments({ isEmailVerified: true }),
    Presentation.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ActivityLog.find().sort({ createdAt: -1 }).limit(50).populate('user', 'name email'),
  ]);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [newUsersLast30Days, newPresentationsLast30Days] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Presentation.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      verifiedUsers,
      totalPresentations,
      newUsersLast30Days,
      newPresentationsLast30Days,
      presentationsByStatus,
      recentActivity,
    },
  });
});

export const getSystemHealth = catchAsync(async (_req: Request, res: Response) => {
  const mongoose = await import('mongoose');
  res.status(200).json({
    success: true,
    data: {
      uptime: process.uptime(),
      dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    },
  });
});
