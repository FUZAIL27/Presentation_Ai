import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger';
import { env } from '../config/env';

function handleCastError(err: mongoose.Error.CastError) {
  return AppError.badRequest(`Invalid ${err.path}: ${err.value}`);
}

function handleDuplicateFieldError(err: { keyValue: Record<string, unknown> }) {
  const field = Object.keys(err.keyValue)[0];
  return AppError.conflict(`${field} already in use. Please use a different value.`);
}

function handleValidationError(err: mongoose.Error.ValidationError) {
  const messages = Object.values(err.errors).map((e) => e.message);
  return AppError.badRequest('Validation failed', messages);
}

function handleJWTError() {
  return AppError.unauthorized('Invalid token. Please log in again.');
}

function handleJWTExpiredError() {
  return AppError.unauthorized('Token expired. Please log in again.');
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route not found: ${req.originalUrl}`));
}

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof mongoose.Error.CastError) {
    error = handleCastError(err);
  } else if (err instanceof mongoose.Error.ValidationError) {
    error = handleValidationError(err);
  } else if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 11000) {
    error = handleDuplicateFieldError(err as unknown as { keyValue: Record<string, unknown> });
  } else if (err instanceof Error && err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err instanceof Error && err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  } else {
    const message = err instanceof Error ? err.message : 'Unknown error';
    error = new AppError(message, 500);
  }

  if (!error.isOperational || error.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${error.message}`, {
      stack: err instanceof Error ? err.stack : undefined,
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${error.message}`);
  }

  res.status(error.statusCode).json({
    success: false,
    status: error.status,
    message: error.isOperational ? error.message : 'Internal server error',
    errors: error.errors,
    ...(env.NODE_ENV === 'development' && err instanceof Error ? { stack: err.stack } : {}),
  });
}
