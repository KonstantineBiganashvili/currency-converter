import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { firstValueFrom } from 'rxjs';
import axiosRetry from 'axios-retry';

import { MonobankRate } from '../interfaces';
import { RatesRepository } from './rates.repository.interface';
import {
  ExternalApiException,
  ExternalApiTimeoutException,
  CircuitBreakerService,
  CircuitBreakerOpenException,
} from '../../common';

const CIRCUIT_BREAKER_NAME = 'monobank-api';

@Injectable()
export class MonobankRepository implements RatesRepository {
  private readonly apiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly circuitBreaker: CircuitBreakerService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.apiUrl =
      this.configService.get<string>('monobank.apiUrl') ?? 'https://api.monobank.ua/bank/currency';

    axiosRetry(this.httpService.axiosRef, {
      retries: 3,
      retryDelay: (retryNumber: number) => axiosRetry.exponentialDelay(retryNumber),
      retryCondition: (error) => {
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429
        );
      },
      onRetry: (retryCount, error) => {
        this.logger.warn(`Retrying Monobank API request (attempt ${retryCount})`, {
          error: error.message,
        });
      },
    });
  }

  async fetchRates(): Promise<MonobankRate[]> {
    return this.circuitBreaker.execute(CIRCUIT_BREAKER_NAME, () => this.doFetchRates(), {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
    });
  }

  private async doFetchRates(): Promise<MonobankRate[]> {
    try {
      this.logger.debug('Fetching rates from Monobank API');

      const response = await firstValueFrom(
        this.httpService.get<MonobankRate[]>(this.apiUrl, {
          timeout: 10000,
        }),
      );

      this.logger.debug(`Fetched ${response.data.length} rates from Monobank`);

      return response.data;
    } catch (error) {
      if (error instanceof CircuitBreakerOpenException) {
        throw error;
      }

      if (error instanceof Error && error.message.includes('timeout')) {
        throw new ExternalApiTimeoutException('Monobank');
      }

      throw new ExternalApiException(
        'Monobank',
        error instanceof Error ? error.message : 'Failed to fetch exchange rates',
      );
    }
  }
}
