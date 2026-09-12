import { Module } from '@nestjs/common';
import { PricesController } from './prices.controller';
import { PriceAnalysisService } from './price-analysis.service';
import { PriceHistoryRepository } from './price-history.repository';
import { OpportunityDetectionService } from './opportunity-detection.service';

@Module({
  controllers: [PricesController],
  providers: [PriceAnalysisService, PriceHistoryRepository, OpportunityDetectionService],
  exports: [PriceAnalysisService, PriceHistoryRepository, OpportunityDetectionService],
})
export class PricesModule {}
