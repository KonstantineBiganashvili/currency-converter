import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

import { RatesService } from './rates.service';
import { CacheService } from '../cache';
import { RATES_REPOSITORY } from './repositories';
import type { RatesRepository } from './repositories';
import { MonobankRate } from './interfaces';

describe('RatesService', () => {
  let service: RatesService;
  let cacheService: jest.Mocked<CacheService>;
  let ratesRepository: jest.Mocked<RatesRepository>;

  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockRates: MonobankRate[] = [
    {
      currencyCodeA: 840, // USD
      currencyCodeB: 980, // UAH
      date: 1705315200,
      rateBuy: 37.5,
      rateSell: 38.0,
      rateCross: 37.75,
    },
    {
      currencyCodeA: 978, // EUR
      currencyCodeB: 980, // UAH
      date: 1705315200,
      rateBuy: 40.5,
      rateSell: 41.0,
      rateCross: 40.75,
    },
  ];

  beforeEach(async () => {
    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockRatesRepository = {
      fetchRates: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatesService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: RATES_REPOSITORY,
          useValue: mockRatesRepository,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<RatesService>(RatesService);
    cacheService = module.get(CacheService);
    ratesRepository = module.get(RATES_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRates', () => {
    it('should return cached rates if available', async () => {
      cacheService.get.mockResolvedValue(mockRates);

      const result = await service.getRates();

      expect(result).toEqual(mockRates);
      expect(cacheService.get).toHaveBeenCalledWith('monobank_rates');
      expect(ratesRepository.fetchRates).not.toHaveBeenCalled();
    });

    it('should fetch from repository and cache when cache miss', async () => {
      cacheService.get.mockResolvedValue(undefined);
      ratesRepository.fetchRates.mockResolvedValue(mockRates);

      const result = await service.getRates();

      expect(result).toEqual(mockRates);
      expect(cacheService.get).toHaveBeenCalledWith('monobank_rates');
      expect(ratesRepository.fetchRates).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalledWith('monobank_rates', mockRates);
    });
  });

  describe('getExchangeRate', () => {
    beforeEach(() => {
      cacheService.get.mockResolvedValue(mockRates);
    });

    it('should return direct rate when available (USD to UAH)', async () => {
      const result = await service.getExchangeRate('USD', 'UAH');

      expect(result).not.toBeNull();
      expect(result?.sourceCurrency).toBe('USD');
      expect(result?.targetCurrency).toBe('UAH');
      expect(result?.rate).toBe(37.5); // rateBuy
    });

    it('should return inverse rate when direct not available (UAH to USD)', async () => {
      const result = await service.getExchangeRate('UAH', 'USD');

      expect(result).not.toBeNull();
      expect(result?.sourceCurrency).toBe('UAH');
      expect(result?.targetCurrency).toBe('USD');
      expect(result?.rate).toBeCloseTo(1 / 38.0, 5); // 1 / rateSell
    });

    it('should return cross rate via UAH (USD to EUR)', async () => {
      const result = await service.getExchangeRate('USD', 'EUR');

      expect(result).not.toBeNull();
      expect(result?.sourceCurrency).toBe('USD');
      expect(result?.targetCurrency).toBe('EUR');
      // USD->UAH rate / EUR->UAH rate = 37.5 / 40.5
      expect(result?.rate).toBeCloseTo(37.5 / 40.5, 5);
    });

    it('should return null for invalid currency code', async () => {
      const result = await service.getExchangeRate('INVALID', 'UAH');

      expect(result).toBeNull();
    });

    it('should return null when no rate found', async () => {
      cacheService.get.mockResolvedValue([]);

      const result = await service.getExchangeRate('USD', 'UAH');

      expect(result).toBeNull();
    });
  });
});
