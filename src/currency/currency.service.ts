import { Injectable } from '@nestjs/common';
import * as currencyCodes from 'currency-codes';

import { RatesService } from '../rates';
import { CurrencyNotFoundException, CurrencyConversionException } from '../common';
import { ConvertRequestDto, ConvertResponseDto } from './dto';

@Injectable()
export class CurrencyService {
  constructor(private readonly ratesService: RatesService) {}

  async convert(dto: ConvertRequestDto): Promise<ConvertResponseDto> {
    const { sourceCurrency, targetCurrency, amount } = dto;

    this.validateCurrencyCode(sourceCurrency);
    this.validateCurrencyCode(targetCurrency);

    if (sourceCurrency === targetCurrency) {
      return {
        sourceCurrency,
        targetCurrency,
        amount,
        convertedAmount: amount,
        rate: 1,
        rateDate: new Date(),
      };
    }

    const exchangeRate = await this.ratesService.getExchangeRate(sourceCurrency, targetCurrency);

    if (!exchangeRate) {
      throw new CurrencyConversionException(
        `Unable to find exchange rate for ${sourceCurrency} to ${targetCurrency}`,
      );
    }

    const convertedAmount = Math.round(amount * exchangeRate.rate * 100) / 100;

    return {
      sourceCurrency,
      targetCurrency,
      amount,
      convertedAmount,
      rate: exchangeRate.rate,
      rateDate: exchangeRate.date,
    };
  }

  private validateCurrencyCode(code: string): void {
    const currency = currencyCodes.code(code);
    if (!currency) {
      throw new CurrencyNotFoundException(code);
    }
  }
}
