import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ImportCsvDto {
  @ApiProperty({ description: 'Raw CSV content as string' })
  @IsString()
  @IsNotEmpty()
  csvContent: string;

  @ApiProperty({ description: 'Product ID to associate all publications with' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Source ID (defaults to IMPORT source)' })
  @IsString()
  @IsNotEmpty()
  sourceId: string;
}
