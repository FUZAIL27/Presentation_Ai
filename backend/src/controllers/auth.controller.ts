import crypto from 'crypto';
import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { User } from '../models/User.model';
import { ActivityLog } from '../models/ActivityLog.model';
import {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
} from '../services/token.service';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';
import { env } from '../config/env';

const REFRESH_COOKIE = 'presentai_refresh_token';

function refreshCookieOptions(rememberMe = true) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/v1/auth',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  };
}

function sanitizeUser(user: InstanceType<typeof User>) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    subscription: user.subscription,
    createdAt: user.createdAt,
  };
}

export const signup = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw AppError.conflict('An account with this email already exists');

  const user = await User.create({ name, email, password });

  const verifyToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${verifyToken}`;
  await sendVerificationEmail(user.email, user.name, verifyUrl);

  await ActivityLog.create({ user: user._id, action: 'user.signup', ip: req.ip, userAgent: req.headers['user-agent'] });

  const accessToken = signAccessToken(String(user._id), user.role);
  const refreshToken = await issueRefreshToken(String(user._id), {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.status(201).json({
    success: true,
    message: 'Account created. Please check your email to verify your account.',
    data: { user: sanitizeUser(user), accessToken },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;

  const user = await User.findOne({ email }).select('+password +active');
  if (!user || !(await user.comparePassword(password))) {
    throw AppError.unauthorized('Incorrect email or password');
  }
  if (!user.active) throw AppError.unauthorized('This account has been deactivated');

  await ActivityLog.create({ user: user._id, action: 'user.login', ip: req.ip, userAgent: req.headers['user-agent'] });

  const accessToken = signAccessToken(String(user._id), user.role);
  const refreshToken = await issueRefreshToken(String(user._id), {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions(rememberMe ?? true));
  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: { user: sanitizeUser(user), accessToken },
  });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw AppError.unauthorized('No refresh token provided');

  const result = await rotateRefreshToken(token, {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  if (!result) {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    throw AppError.unauthorized('Session expired. Please log in again.');
  }

  res.cookie(REFRESH_COOKIE, result.newRefreshToken, refreshCookieOptions());
  res.status(200).json({
    success: true,
    data: { accessToken: result.newAccessToken },
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await revokeRefreshToken(token);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });

  if (req.user) {
    await ActivityLog.create({ user: req.user.id, action: 'user.logout', ip: req.ip });
  }

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const logoutAllDevices = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  await revokeAllUserSessions(req.user.id);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  res.status(200).json({ success: true, message: 'Logged out of all devices' });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return success to avoid leaking which emails are registered
  if (!user) {
    res.status(200).json({
      success: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    });
    return;
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
  await sendPasswordResetEmail(user.email, user.name, resetUrl);

  res.status(200).json({
    success: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  });
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) throw AppError.badRequest('Password reset token is invalid or has expired');

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await revokeAllUserSessions(String(user._id));
  await ActivityLog.create({ user: user._id, action: 'user.password_reset', ip: req.ip });

  res.status(200).json({ success: true, message: 'Password reset successfully. Please log in again.' });
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) throw AppError.badRequest('Verification token is invalid or has expired');

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  await ActivityLog.create({ user: user._id, action: 'user.email_verified', ip: req.ip });

  res.status(200).json({ success: true, message: 'Email verified successfully' });
});

export const resendVerification = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const user = await User.findById(req.user.id);
  if (!user) throw AppError.notFound('User not found');
  if (user.isEmailVerified) {
    res.status(200).json({ success: true, message: 'Email is already verified' });
    return;
  }

  const verifyToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${verifyToken}`;
  await sendVerificationEmail(user.email, user.name, verifyUrl);

  res.status(200).json({ success: true, message: 'Verification email sent' });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const user = await User.findById(req.user.id);
  if (!user) throw AppError.notFound('User not found');
  res.status(200).json({ success: true, data: { user: sanitizeUser(user) } });
});
