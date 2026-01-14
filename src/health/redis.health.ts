import { Injectable } from '@nestjs/common';
import { HealthIndicatorService, HealthIndicatorResult } from '@nestjs/terminus';
import { CacheService } from '../cache';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly cacheService: CacheService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const testKey = 'health_check_test';
    const testValue = 'ok';

    try {
      await this.cacheService.set(testKey, testValue, 10000);
      const result = await this.cacheService.get<string>(testKey);

      if (result === testValue) {
        return indicator.up();
      }

      return indicator.down({ message: 'Redis read/write check failed' });
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
