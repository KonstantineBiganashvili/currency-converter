import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as currencyCodes from 'currency-codes';

import { CacheService } from '../cache';
import { MonobankRate, ExchangeRate } from './interfaces';
import { RATES_REPOSITORY } from './repositories';
import type { RatesRepository } from './repositories';

const CACHE_KEY = 'monobank_rates';
const UAH_CODE = 980;

@Injectable()
export class RatesService {
  constructor(
    @Inject(RATES_REPOSITORY) private readonly ratesRepository: RatesRepository,
    private readonly cacheService: CacheService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async getRates(): Promise<MonobankRate[]> {
    const cached = await this.cacheService.get<MonobankRate[]>(CACHE_KEY);

    if (cached) {
      this.logger.debug('Returning cached rates');
      return cached;
    }

    this.logger.debug('Cache miss, fetching from Monobank');
    const rates = await this.ratesRepository.fetchRates();

    await this.cacheService.set(CACHE_KEY, rates);
    this.logger.debug('Rates cached successfully');

    return rates;
  }

  async getExchangeRate(
    sourceCurrency: string,
    targetCurrency: string,
  ): Promise<ExchangeRate | null> {
    const sourceCode = this.getCurrencyNumericCode(sourceCurrency);
    const targetCode = this.getCurrencyNumericCode(targetCurrency);

    if (!sourceCode || !targetCode) {
      return null;
    }

    const rates = await this.getRates();

    const rate = this.findRate(rates, sourceCode, targetCode);

    if (!rate) {
      return null;
    }

    return {
      sourceCurrency,
      targetCurrency,
      rate: rate.rate,
      date: new Date(rate.date * 1000),
    };
  }

  private findRate(
    rates: MonobankRate[],
    sourceCode: number,
    targetCode: number,
  ): { rate: number; date: number } | null {
    // Direct rate: source -> target
    const directRate = rates.find(
      (r) => r.currencyCodeA === sourceCode && r.currencyCodeB === targetCode,
    );

    if (directRate) {
      const rate = directRate.rateBuy ?? directRate.rateCross;
      if (rate) {
        return { rate, date: directRate.date };
      }
    }

    // Inverse rate: target -> source
    const inverseRate = rates.find(
      (r) => r.currencyCodeA === targetCode && r.currencyCodeB === sourceCode,
    );

    if (inverseRate) {
      const rate = inverseRate.rateSell ?? inverseRate.rateCross;
      if (rate) {
        return { rate: 1 / rate, date: inverseRate.date };
      }
    }

    // Cross rate via UAH
    if (sourceCode !== UAH_CODE && targetCode !== UAH_CODE) {
      const sourceToUah = this.findRate(rates, sourceCode, UAH_CODE);
      const targetToUah = this.findRate(rates, targetCode, UAH_CODE);

      if (sourceToUah && targetToUah) {
        return {
          rate: sourceToUah.rate / targetToUah.rate,
          date: Math.min(sourceToUah.date, targetToUah.date),
        };
      }
    }

    return null;
  }

  private getCurrencyNumericCode(currencyCode: string): number | null {
    const currency = currencyCodes.code(currencyCode.toUpperCase());
    return currency ? parseInt(currency.number, 10) : null;
  }
}
