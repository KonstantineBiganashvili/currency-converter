import { Test, TestingModule } from '@nestjs/testing';

import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { ConvertRequestDto, ConvertResponseDto } from './dto';

describe('CurrencyController', () => {
  let controller: CurrencyController;
  let currencyService: jest.Mocked<CurrencyService>;

  beforeEach(async () => {
    const mockCurrencyService = {
      convert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurrencyController],
      providers: [
        {
          provide: CurrencyService,
          useValue: mockCurrencyService,
        },
      ],
    }).compile();

    controller = module.get<CurrencyController>(CurrencyController);
    currencyService = module.get(CurrencyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('convert', () => {
    it('should call currencyService.convert with dto', async () => {
      const dto: ConvertRequestDto = {
        sourceCurrency: 'USD',
        targetCurrency: 'UAH',
        amount: 100,
      };

      const expectedResponse: ConvertResponseDto = {
        sourceCurrency: 'USD',
        targetCurrency: 'UAH',
        amount: 100,
        convertedAmount: 4150,
        rate: 41.5,
        rateDate: new Date('2024-01-15'),
      };

      currencyService.convert.mockResolvedValue(expectedResponse);

      const result = await controller.convert(dto);

      expect(result).toEqual(expectedResponse);
      expect(currencyService.convert).toHaveBeenCalledWith(dto);
    });

    it('should propagate errors from service', async () => {
      const dto: ConvertRequestDto = {
        sourceCurrency: 'USD',
        targetCurrency: 'UAH',
        amount: 100,
      };

      const error = new Error('Service error');
      currencyService.convert.mockRejectedValue(error);

      await expect(controller.convert(dto)).rejects.toThrow('Service error');
    });
  });
});
