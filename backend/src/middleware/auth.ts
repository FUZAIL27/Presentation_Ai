import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { verifyAccessToken } from '../services/token.service';
import { User } from '../models/User.model';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'user' | 'admin';
        email: string;
        name: string;
      };
    }
  }
}

export const protect = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

  if (!token) {
    return next(AppError.unauthorized('You are not logged in. Please log in to access this resource.'));
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return next(AppError.unauthorized('Invalid or expired token. Please log in again.'));
  }

  const currentUser = await User.findById(decoded.sub).select('+active');
  if (!currentUser || !currentUser.active) {
    return next(AppError.unauthorized('The user belonging to this token no longer exists.'));
  }

  if (currentUser.changedPasswordAfter(decoded.iat ?? 0)) {
    return next(AppError.unauthorized('Password was recently changed. Please log in again.'));
  }

  req.user = {
    id: String(currentUser._id),
    role: currentUser.role,
    email: currentUser.email,
    name: currentUser.name,
  };
  next();
});

export const restrictTo = (...roles: Array<'user' | 'admin'>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to perform this action.'));
    }
    next();
  };
};
