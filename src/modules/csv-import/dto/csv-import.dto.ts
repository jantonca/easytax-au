import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for column mapping configuration.
 */
export class ColumnMappingDto {
  @ApiProperty({ description: 'Column name for date', example: 'Date' })
  @IsString()
  date!: string;

  @ApiProperty({ description: 'Column name for item/vendor', example: 'Item' })
  @IsString()
  item!: string;

  @ApiProperty({ description: 'Column name for total amount', example: 'Total' })
  @IsString()
  total!: string;

  @ApiPropertyOptional({ description: 'Column name for GST', example: 'GST' })
  @IsString()
  @IsOptional()
  gst?: string;

  @ApiPropertyOptional({
    description: 'Column name for business use %',
    example: 'Biz%',
  })
  @IsString()
  @IsOptional()
  bizPercent?: string;

  @ApiPropertyOptional({
    description: 'Column name for category',
    example: 'Category',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Column name for description',
    example: 'Notes',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * DTO for CSV import request.
 */
export class CsvImportRequestDto {
  @ApiPropertyOptional({
    description: 'Predefined source format',
    enum: ['custom', 'commbank', 'amex', 'nab', 'westpac', 'anz'],
    example: 'custom',
  })
  @IsString()
  @IsIn(['custom', 'commbank', 'amex', 'nab', 'westpac', 'anz'])
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({
    description: 'Custom column mapping (overrides source)',
    type: ColumnMappingDto,
  })
  @ValidateNested()
  @Type(() => ColumnMappingDto)
  @IsOptional()
  mapping?: ColumnMappingDto;

  @ApiPropertyOptional({
    description: 'Provider matching threshold (0-1)',
    minimum: 0,
    maximum: 1,
    default: 0.6,
    example: 0.6,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  matchThreshold?: number;

  @ApiPropertyOptional({
    description: 'Skip duplicate expenses',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  skipDuplicates?: boolean;

  @ApiPropertyOptional({
    description: 'Preview mode - do not create expenses',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}

/**
 * Response for a single row result.
 */
export class CsvRowResultDto {
  @ApiProperty({ description: 'Row number in CSV (1-based)', example: 1 })
  rowNumber!: number;

  @ApiProperty({ description: 'Whether row was processed successfully' })
  success!: boolean;

  @ApiPropertyOptional({ description: 'Whether row was skipped as duplicate' })
  isDuplicate?: boolean;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;

  @ApiPropertyOptional({ description: 'Matched provider name' })
  providerName?: string;

  @ApiPropertyOptional({ description: 'Provider match confidence score' })
  matchScore?: number;

  @ApiPropertyOptional({ description: 'Matched category name' })
  categoryName?: string;

  @ApiPropertyOptional({ description: 'Amount in cents' })
  amountCents?: number;

  @ApiPropertyOptional({ description: 'GST in cents' })
  gstCents?: number;
}

/**
 * Response for CSV import operation.
 */
export class CsvImportResponseDto {
  @ApiProperty({
    description: 'Import job ID for tracking',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  importJobId!: string;

  @ApiProperty({ description: 'Total rows in CSV', example: 10 })
  totalRows!: number;

  @ApiProperty({ description: 'Successfully imported rows', example: 8 })
  successCount!: number;

  @ApiProperty({ description: 'Failed rows', example: 1 })
  failedCount!: number;

  @ApiProperty({ description: 'Duplicate rows skipped', example: 1 })
  duplicateCount!: number;

  @ApiProperty({ description: 'Total amount in cents', example: 125000 })
  totalAmountCents!: number;

  @ApiProperty({ description: 'Total GST in cents', example: 11363 })
  totalGstCents!: number;

  @ApiProperty({ description: 'Processing time in milliseconds', example: 150 })
  processingTimeMs!: number;

  @ApiProperty({
    description: 'Detailed results for each row',
    type: [CsvRowResultDto],
  })
  rows!: CsvRowResultDto[];
}
