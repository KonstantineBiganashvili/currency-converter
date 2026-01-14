import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class ConvertRequestDto {
  @ApiProperty({
    description: 'Source currency code (ISO 4217)',
    example: 'USD',
    minLength: 3,
    maxLength: 3,
  })
  @IsString()
  @Length(3, 3)
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  sourceCurrency: string;

  @ApiProperty({
    description: 'Target currency code (ISO 4217)',
    example: 'UAH',
    minLength: 3,
    maxLength: 3,
  })
  @IsString()
  @Length(3, 3)
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  targetCurrency: string;

  @ApiProperty({
    description: 'Amount to convert',
    example: 100,
    minimum: 0,
  })
  @IsNumber()
  @IsPositive()
  amount: number;
}
