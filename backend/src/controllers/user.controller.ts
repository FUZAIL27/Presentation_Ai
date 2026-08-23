import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { User } from '../models/User.model';
import { revokeAllUserSessions } from '../services/token.service';
import { uploadBuffer } from '../services/cloudinary.service';

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { name, avatarUrl } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) throw AppError.notFound('User not found');

  if (name) user.name = name;
  if (avatarUrl) user.avatarUrl = avatarUrl;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    },
  });
});

export const uploadAvatar = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  if (!req.file) throw AppError.badRequest('No image file provided');

  const result = await uploadBuffer(req.file.buffer, 'avatars', `user_${req.user.id}`);

  const user = await User.findById(req.user.id);
  if (!user) throw AppError.notFound('User not found');
  user.avatarUrl = result.url;
  await user.save();

  res.status(200).json({ success: true, data: { avatarUrl: result.url } });
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');
  if (!user) throw AppError.notFound('User not found');

  if (!(await user.comparePassword(currentPassword))) {
    throw AppError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  await revokeAllUserSessions(req.user.id);

  res.status(200).json({ success: true, message: 'Password changed successfully. Please log in again.' });
});

export const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();

  const user = await User.findById(req.user.id).select('+active');
  if (!user) throw AppError.notFound('User not found');

  user.active = false;
  await user.save({ validateBeforeSave: false });
  await revokeAllUserSessions(req.user.id);

  res.status(200).json({ success: true, message: 'Account deleted successfully' });
});
