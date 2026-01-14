import { ApiProperty } from '@nestjs/swagger';

export class ConvertResponseDto {
  @ApiProperty({
    description: 'Source currency code',
    example: 'USD',
  })
  sourceCurrency: string;

  @ApiProperty({
    description: 'Target currency code',
    example: 'UAH',
  })
  targetCurrency: string;

  @ApiProperty({
    description: 'Original amount',
    example: 100,
  })
  amount: number;

  @ApiProperty({
    description: 'Converted amount',
    example: 4150.5,
  })
  convertedAmount: number;

  @ApiProperty({
    description: 'Exchange rate used',
    example: 41.505,
  })
  rate: number;

  @ApiProperty({
    description: 'Rate timestamp',
    example: '2024-01-14T12:00:00.000Z',
  })
  rateDate: Date;
}
