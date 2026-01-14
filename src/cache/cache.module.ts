import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';
import { Keyv } from 'keyv';

import { CacheService } from './cache.service';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get<string>('redis.host') ?? 'localhost';
        const redisPort = configService.get<number>('redis.port') ?? 6379;
        const ttl = (configService.get<number>('cache.ttl') ?? 300) * 1000;

        const redisKeyv: Keyv = createKeyv(`redis://${redisHost}:${redisPort}`);

        return {
          ttl,
          stores: [redisKeyv],
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [NestCacheModule, CacheService],
})
export class CacheModule {}
