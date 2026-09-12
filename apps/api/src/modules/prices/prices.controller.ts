import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PriceAnalysisService } from './price-analysis.service';
import { OpportunityDetectionService } from './opportunity-detection.service';
import { MarketStatsDto, DailyPricePointDto, OpportunityDto } from './dto/price.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('prices')
@Controller('products')
export class PricesController {
  constructor(
    private readonly priceAnalysis: PriceAnalysisService,
    private readonly opportunityDetection: OpportunityDetectionService,
  ) {}

  @Public()
  @Get(':id/market')
  @ApiOperation({ summary: 'Get market stats + opportunities for a product' })
  @ApiQuery({ name: 'currency', required: false, enum: ['CUP', 'USD', 'MLC', 'EUR'] })
  async getMarket(
    @Param('id') id: string,
    @Query('currency') currency = 'CUP',
  ): Promise<MarketStatsDto & { opportunities: OpportunityDto[] }> {
    const [stats, opportunities] = await Promise.all([
      this.priceAnalysis.calculateStats(id, currency),
      this.opportunityDetection.detectOpportunities(id, currency),
    ]);
    return { ...stats, opportunities };
  }

  @Public()
  @Get(':id/price-history')
  @ApiOperation({ summary: 'Get daily price history for a product' })
  @ApiQuery({ name: 'from', required: true, example: '2024-01-01' })
  @ApiQuery({ name: 'to', required: true, example: '2024-12-31' })
  getPriceHistory(
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<DailyPricePointDto[]> {
    return this.priceAnalysis.getPriceHistory(id, new Date(from), new Date(to));
  }
}
