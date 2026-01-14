import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { CacheModule } from '../cache';
import { RatesService } from './rates.service';
import { MonobankRepository, RATES_REPOSITORY } from './repositories';

@Module({
  imports: [HttpModule, CacheModule],
  providers: [
    RatesService,
    {
      provide: RATES_REPOSITORY,
      useClass: MonobankRepository,
    },
  ],
  exports: [RatesService],
})
export class RatesModule {}
