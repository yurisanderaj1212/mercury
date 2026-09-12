import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponse {
  success: false;
  message: string;
  errors: Array<{ field?: string; code: string }> | null;
  data: null;
  meta: null;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Never expose stack traces to the client
    if (process.env.NODE_ENV !== 'test') {
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    }

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: ErrorResponse['errors'] = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        message = typeof res['message'] === 'string' ? res['message'] : message;

        // Handle class-validator errors
        if (Array.isArray(res['message'])) {
          message = 'VALIDATION_ERROR';
          errors = (res['message'] as string[]).map((msg) => ({
            code: msg,
          }));
        }

        // Handle our custom error codes
        if (typeof res['code'] === 'string') {
          message = res['code'];
        }
      }
    }

    // Map common HTTP statuses to our error codes
    if (statusCode === HttpStatus.NOT_FOUND && message === 'Not Found') {
      message = 'ENDPOINT_NOT_FOUND';
    }

    const errorResponse: ErrorResponse = {
      success: false,
      message,
      errors,
      data: null,
      meta: null,
    };

    response
      .status(statusCode)
      .header('Content-Type', 'application/json; charset=utf-8')
      .json(errorResponse);
  }
}
