import { Test, TestingModule } from '@nestjs/testing';

import { CurrencyService } from './currency.service';
import { RatesService } from '../rates';
import { CurrencyNotFoundException, CurrencyConversionException } from '../common';
import { ConvertRequestDto } from './dto';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let ratesService: jest.Mocked<RatesService>;

  beforeEach(async () => {
    const mockRatesService = {
      getExchangeRate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        {
          provide: RatesService,
          useValue: mockRatesService,
        },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
    ratesService = module.get(RatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('convert', () => {
    it('should return same amount when source and target currency are the same', async () => {
      const dto: ConvertRequestDto = {
        sourceCurrency: 'USD',
        targetCurrency: 'USD',
        amount: 100,
      };

      const result = await service.convert(dto);

      expect(result.sourceCurrency).toBe('USD');
      expect(result.targetCurrency).toBe('USD');
      expect(result.amount).toBe(100);
      expect(result.convertedAmount).toBe(100);
      expect(result.rate).toBe(1);
      expect(ratesService.getExchangeRate).not.toHaveBeenCalled();
    });

    it('should convert currency successfully', async () => {
      const dto: ConvertRequestDto = {
        sourceCurrency: 'USD',
        targetCurrency: 'UAH',
        amount: 100,
      };

      ratesService.getExchangeRate.mockResolvedValue({
        sourceCurrency: 'USD',
        targetCurrency: 'UAH',
        rate: 41.5,
        date: new Date('2024-01-15'),
      });

      const result = await service.convert(dto);

      expect(result.sourceCurrency).toBe('USD');
      expect(result.targetCurrency).toBe('UAH');
      expect(result.amount).toBe(100);
      expect(result.convertedAmount).toBe(4150);
      expect(result.rate).toBe(41.5);
      expect(ratesService.getExchangeRate).toHaveBeenCalledWith('USD', 'UAH');
    });

    it('should round converted amount to 2 decimal places', async () => {
      const dto: ConvertRequestDto = {
        sourceCurrency: 'USD',
        targetCurrency: 'UAH',
        amount: 100,
      };

      ratesService.getExchangeRate.mockResolvedValue({
        sourceCurrency: 'USD',
        targetCurrency: 'UAH',
        rate: 41.5678,
        date: new Date('2024-01-15'),
      });

      const result = await service.convert(dto);

      expect(result.convertedAmount).toBe(4156.78);
    });

    it('should throw CurrencyNotFoundException for invalid source currency', async () => {
      const dto: ConvertRequestDto = {
        sourceCurrency: 'INVALID',
        targetCurrency: 'UAH',
        amount: 100,
      };

      await expect(service.convert(dto)).rejects.toThrow(CurrencyNotFoundException);
    });

    it('should throw CurrencyNotFoundException for invalid target currency', async () => {
      const dto: ConvertRequestDto = {
        sourceCurrency: 'USD',
        targetCurrency: 'INVALID',
        amount: 100,
      };

      await expect(service.convert(dto)).rejects.toThrow(CurrencyNotFoundException);
    });

    it('should throw CurrencyConversionException when exchange rate not found', async () => {
      const dto: ConvertRequestDto = {
        sourceCurrency: 'USD',
        targetCurrency: 'EUR',
        amount: 100,
      };

      ratesService.getExchangeRate.mockResolvedValue(null);

      await expect(service.convert(dto)).rejects.toThrow(CurrencyConversionException);
    });
  });
});
