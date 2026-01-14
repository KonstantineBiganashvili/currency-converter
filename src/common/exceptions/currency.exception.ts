import { HttpStatus } from '@nestjs/common';

import { BaseException } from './base.exception';

export class CurrencyNotFoundException extends BaseException {
  constructor(currencyCode: string) {
    super(
      `Currency '${currencyCode}' not found or not supported`,
      HttpStatus.NOT_FOUND,
      'CURRENCY_NOT_FOUND',
    );
  }
}

export class CurrencyConversionException extends BaseException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST, 'CURRENCY_CONVERSION_ERROR');
  }
}

export class InvalidAmountException extends BaseException {
  constructor() {
    super('Amount must be a positive number', HttpStatus.BAD_REQUEST, 'INVALID_AMOUNT');
  }
}
