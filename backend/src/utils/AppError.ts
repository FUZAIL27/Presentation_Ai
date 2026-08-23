export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;
  public readonly errors?: unknown;

  constructor(message: string, statusCode: number, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: unknown) {
    return new AppError(message, 400, errors);
  }
  static unauthorized(message = 'Not authenticated') {
    return new AppError(message, 401);
  }
  static forbidden(message = 'Not authorized') {
    return new AppError(message, 403);
  }
  static notFound(message = 'Resource not found') {
    return new AppError(message, 404);
  }
  static conflict(message: string) {
    return new AppError(message, 409);
  }
  static tooManyRequests(message = 'Too many requests') {
    return new AppError(message, 429);
  }
  static internal(message = 'Something went wrong') {
    return new AppError(message, 500);
  }
}
