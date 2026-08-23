import { Router } from 'express';
import { validate } from '../middleware/validate';
import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validator';
import {
  signup,
  login,
  refresh,
  logout,
  logoutAllDevices,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getMe,
} from '../controllers/auth.controller';

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/logout-all', protect, logoutAllDevices);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', protect, resendVerification);
router.get('/me', protect, getMe);

export default router;
