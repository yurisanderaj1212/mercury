import { Module } from '@nestjs/common';
import { SellersRepository } from './sellers.repository';

@Module({
  providers: [SellersRepository],
  exports: [SellersRepository],
})
export class SellersModule {}
