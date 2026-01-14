import { HttpStatus } from '@nestjs/common';

import { BaseException } from './base.exception';

export class ExternalApiException extends BaseException {
  constructor(serviceName: string, message?: string) {
    super(
      message ?? `External service '${serviceName}' is unavailable`,
      HttpStatus.SERVICE_UNAVAILABLE,
      'EXTERNAL_API_ERROR',
    );
  }
}

export class ExternalApiTimeoutException extends BaseException {
  constructor(serviceName: string) {
    super(
      `Request to '${serviceName}' timed out`,
      HttpStatus.GATEWAY_TIMEOUT,
      'EXTERNAL_API_TIMEOUT',
    );
  }
}
