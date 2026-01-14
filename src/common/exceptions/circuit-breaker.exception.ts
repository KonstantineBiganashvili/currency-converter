import { HttpStatus } from '@nestjs/common';

import { BaseException } from './base.exception';

export class CircuitBreakerOpenException extends BaseException {
  constructor(service: string) {
    super(
      `Service ${service} is temporarily unavailable. Please try again later.`,
      HttpStatus.SERVICE_UNAVAILABLE,
      'CIRCUIT_BREAKER_OPEN',
    );
  }
}
