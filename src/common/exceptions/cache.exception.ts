import { HttpStatus } from '@nestjs/common';

import { BaseException } from './base.exception';

export class CacheException extends BaseException {
  constructor(message?: string) {
    super(message ?? 'Cache operation failed', HttpStatus.INTERNAL_SERVER_ERROR, 'CACHE_ERROR');
  }
}
