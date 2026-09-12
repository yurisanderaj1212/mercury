import { Module } from '@nestjs/common';
import { SourcesRepository } from './sources.repository';

@Module({
  providers: [SourcesRepository],
  exports: [SourcesRepository],
})
export class SourcesModule {}
