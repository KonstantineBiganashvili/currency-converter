import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path?: string;
}

export class BaseException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus,
    public readonly errorCode: string,
  ) {
    super(message, statusCode);
  }
}
