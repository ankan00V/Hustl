/**
 * Custom application error class with HTTP status codes
 * Used throughout the application for consistent error handling
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, code: string = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(message: string, code: string = "BAD_REQUEST"): AppError {
    return new AppError(400, message, code);
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(message: string = "Unauthorized", code: string = "UNAUTHORIZED"): AppError {
    return new AppError(401, message, code);
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(message: string = "Forbidden", code: string = "FORBIDDEN"): AppError {
    return new AppError(403, message, code);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(message: string = "Resource not found", code: string = "NOT_FOUND"): AppError {
    return new AppError(404, message, code);
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(message: string, code: string = "CONFLICT"): AppError {
    return new AppError(409, message, code);
  }

  /**
   * Create a 422 Unprocessable Entity error
   */
  static unprocessable(message: string, code: string = "UNPROCESSABLE"): AppError {
    return new AppError(422, message, code);
  }

  /**
   * Create a 429 Too Many Requests error
   */
  static tooManyRequests(message: string = "Too many requests", code: string = "RATE_LIMIT"): AppError {
    return new AppError(429, message, code);
  }

  /**
   * Create a 500 Internal Server Error
   */
  static internal(message: string = "Internal server error", code: string = "INTERNAL_ERROR"): AppError {
    return new AppError(500, message, code);
  }
}
