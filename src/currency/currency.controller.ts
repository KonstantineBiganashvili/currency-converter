import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

import { CurrencyService } from './currency.service';
import { ConvertRequestDto, ConvertResponseDto } from './dto';

@ApiTags('Currency')
@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Post('convert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert currency' })
  @ApiBody({ type: ConvertRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Currency converted successfully',
    type: ConvertResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or conversion error',
  })
  @ApiResponse({
    status: 404,
    description: 'Currency not found',
  })
  @ApiResponse({
    status: 503,
    description: 'External API unavailable',
  })
  async convert(@Body() dto: ConvertRequestDto): Promise<ConvertResponseDto> {
    return this.currencyService.convert(dto);
  }
}
