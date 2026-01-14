import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Request, Response } from 'express';

import { BaseException, ErrorResponse } from '../exceptions';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, errorCode, message } = this.getErrorDetails(exception);

    const errorResponse: ErrorResponse = {
      statusCode,
      error: errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logError(exception, request, statusCode);

    response.status(statusCode).json(errorResponse);
  }

  private getErrorDetails(exception: unknown): {
    statusCode: number;
    errorCode: string;
    message: string;
  } {
    if (exception instanceof BaseException) {
      return {
        statusCode: exception.getStatus(),
        errorCode: exception.errorCode,
        message: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      let message: string;
      if (typeof response === 'object' && response !== null) {
        const responseObj = response as Record<string, unknown>;
        if (Array.isArray(responseObj.message)) {
          message = (responseObj.message as string[]).join(', ');
        } else if (typeof responseObj.message === 'string') {
          message = responseObj.message;
        } else {
          message = exception.message;
        }
      } else {
        message = String(response);
      }

      return {
        statusCode: status,
        errorCode: this.getHttpErrorCode(status),
        message,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    };
  }

  private getHttpErrorCode(status: number): string {
    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };

    return errorCodes[status] ?? 'UNKNOWN_ERROR';
  }

  private logError(exception: unknown, request: Request, statusCode: number): void {
    const logContext: Record<string, unknown> = {
      method: request.method,
      url: request.url,
      statusCode,
      body: request.body as unknown,
    };

    if (statusCode >= 500) {
      this.logger.error('Server error', {
        ...logContext,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    } else if (statusCode >= 400) {
      this.logger.warn('Client error', logContext);
    }
  }
}
