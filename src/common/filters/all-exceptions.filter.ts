import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Standardized error response format.
 *
 * This interface defines the shape of all error responses from the API.
 * 4xx errors include detailed messages; 5xx errors return generic messages
 * to avoid leaking internal implementation details.
 */
export interface ErrorResponse {
  /** HTTP status code (e.g., 400, 404, 500) */
  statusCode: number;
  /** Human-readable error message or array of validation messages */
  message: string | string[];
  /** HTTP status text (e.g., "Not Found", "Internal Server Error") */
  error: string;
  /** ISO timestamp of when the error occurred */
  timestamp: string;
  /** Request path that caused the error */
  path: string;
}

/**
 * Global exception filter that catches all unhandled exceptions.
 *
 * **Behavior:**
 * - For `HttpException` (4xx): Preserves NestJS's default behavior with
 *   detailed error messages for client debugging.
 * - For unhandled exceptions (5xx): Returns a generic error message to
 *   prevent leaking internal details (security best practice).
 *
 * **Logging:**
 * - 4xx errors: Logged at WARN level (expected client errors)
 * - 5xx errors: Logged at ERROR level with full stack trace (server issues)
 *
 * **Security:**
 * - Stack traces are NEVER sent to the client
 * - Internal error messages are NEVER exposed for 5xx errors
 * - All errors include timestamp and path for debugging
 *
 * @example
 * // In main.ts
 * app.useGlobalFilters(new AllExceptionsFilter());
 *
 * @see https://docs.nestjs.com/exception-filters
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = request.url;

    // Handle known HTTP exceptions (4xx, some 5xx)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Extract message from NestJS exception response
      const message = this.extractMessage(exceptionResponse);
      const error = this.getHttpStatusText(status);

      // Log 4xx as warnings, 5xx as errors
      if (status >= 500) {
        this.logger.error(`[${status}] ${path} - ${JSON.stringify(message)}`, exception.stack);
      } else {
        this.logger.warn(`[${status}] ${path} - ${JSON.stringify(message)}`);
      }

      const errorResponse: ErrorResponse = {
        statusCode: status,
        message,
        error,
        timestamp,
        path,
      };

      response.status(status).json(errorResponse);
      return;
    }

    // Handle unknown exceptions (unexpected 500s)
    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    // Log the full error for debugging (server-side only)
    this.logger.error(
      `[${status}] ${path} - Unhandled exception`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    // Return generic message to client (never expose internal details)
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message: 'An unexpected error occurred. Please try again later.',
      error: 'Internal Server Error',
      timestamp,
      path,
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Extracts the message from a NestJS exception response.
   *
   * NestJS exceptions can have different response shapes:
   * - String: "Not Found"
   * - Object: { message: "Not Found", error: "Not Found", statusCode: 404 }
   * - Object with array: { message: ["field is required"], ... }
   */
  private extractMessage(exceptionResponse: string | object): string | string[] {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const response = exceptionResponse as Record<string, unknown>;

      // Handle validation errors (array of messages)
      if (Array.isArray(response.message)) {
        return response.message as string[];
      }

      // Handle single message
      if (typeof response.message === 'string') {
        return response.message;
      }
    }

    return 'An error occurred';
  }

  /**
   * Maps HTTP status codes to human-readable text.
   */
  private getHttpStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };

    return statusTexts[status] ?? 'Error';
  }
}
