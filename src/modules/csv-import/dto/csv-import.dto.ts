import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
  Min,
  Max,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Strict boolean coercion for multipart/JSON payloads.
 *
 * Multipart form fields always arrive as strings; JSON bodies may carry real
 * booleans or strings. Accepted representations are true/1 and false/0/''
 * (empty string means unchecked checkbox). Anything else is left untouched so
 * @IsBoolean rejects it with 400 instead of silently coercing to a boolean.
 *
 * @Type(() => Object) is required: with the global ValidationPipe's
 * `enableImplicitConversion`, class-transformer pre-coerces primitives via
 * Boolean(value) before custom transforms run, so a "false" multipart field
 * would arrive as true. Declaring an explicit (pass-through) Object type
 * suppresses that pre-coercion and lets the raw string reach this transform.
 */
const parseBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0' || value === '') return false;
  return value;
};

/** Combines the suppression marker and the strict coercion in one decorator set. */
export const StrictBoolean = () => (target: object, propertyKey: string) => {
  Type(() => Object)(target, propertyKey);
  Transform(parseBoolean, { toClassOnly: true })(target, propertyKey);
};

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
  @StrictBoolean()
  @IsBoolean()
  @IsOptional()
  skipDuplicates?: boolean;

  @ApiPropertyOptional({
    description: 'Preview mode - do not create expenses',
    default: false,
  })
  @StrictBoolean()
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}

/**
 * DTO for importing expenses from CSV content via a JSON body.
 *
 * `content` is declared here (not only in the controller signature) so the
 * global whitelist keeps it and its string-ness is actually validated.
 */
export class CsvImportContentRequestDto extends CsvImportRequestDto {
  @ApiProperty({
    description: 'CSV content as string',
    example: 'Date,Item,Total,GST\n2025-07-15,Internet,$88.00,$8.00',
  })
  @IsString()
  @IsNotEmpty({ message: 'CSV content is required' })
  content!: string;
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

  @ApiPropertyOptional({ description: 'Transaction date (ISO 8601)' })
  date?: string;

  @ApiPropertyOptional({ description: 'Expense description' })
  description?: string;

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
    description: 'Import job ID for tracking (null for dry-run previews, which persist nothing)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    nullable: true,
  })
  importJobId!: string | null;

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

// =============================================================================
// INCOME CSV IMPORT DTOs
// =============================================================================

/**
 * DTO for income column mapping configuration.
 */
export class IncomeColumnMappingDto {
  @ApiProperty({ description: 'Column name for client', example: 'Client' })
  @IsString()
  client!: string;

  @ApiPropertyOptional({ description: 'Column name for invoice number', example: 'Invoice #' })
  @IsString()
  @IsOptional()
  invoiceNum?: string;

  @ApiProperty({ description: 'Column name for subtotal', example: 'Subtotal' })
  @IsString()
  subtotal!: string;

  @ApiProperty({ description: 'Column name for GST', example: 'GST' })
  @IsString()
  gst!: string;

  @ApiProperty({ description: 'Column name for total', example: 'Total' })
  @IsString()
  total!: string;

  @ApiPropertyOptional({ description: 'Column name for date', example: 'Date' })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: 'Column name for description', example: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * DTO for income CSV import request.
 */
export class IncomeCsvImportRequestDto {
  @ApiPropertyOptional({
    description: 'Predefined source format',
    enum: ['custom'],
    example: 'custom',
  })
  @IsString()
  @IsIn(['custom'])
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({
    description: 'Custom column mapping (overrides source)',
    type: IncomeColumnMappingDto,
  })
  @ValidateNested()
  @Type(() => IncomeColumnMappingDto)
  @IsOptional()
  mapping?: IncomeColumnMappingDto;

  @ApiPropertyOptional({
    description: 'Client matching threshold (0-1)',
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
    description: 'Skip duplicate incomes',
    default: true,
  })
  @StrictBoolean()
  @IsBoolean()
  @IsOptional()
  skipDuplicates?: boolean;

  @ApiPropertyOptional({
    description: 'Preview mode - do not create incomes',
    default: false,
  })
  @StrictBoolean()
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;

  @ApiPropertyOptional({
    description: 'Mark all imported incomes as paid',
    default: false,
  })
  @StrictBoolean()
  @IsBoolean()
  @IsOptional()
  markAsPaid?: boolean;
}

/**
 * DTO for importing incomes from CSV content via a JSON body.
 *
 * `content` is declared here (not only in the controller signature) so the
 * global whitelist keeps it and its string-ness is actually validated.
 */
export class IncomeCsvImportContentRequestDto extends IncomeCsvImportRequestDto {
  @ApiProperty({
    description: 'CSV content as string',
    example: 'Client,Invoice #,Subtotal,GST,Total\nAcme Corp,INV-001,$1000,$100,$1100',
  })
  @IsString()
  @IsNotEmpty({ message: 'CSV content is required' })
  content!: string;
}

/**
 * Response for a single income row result.
 */
export class IncomeCsvRowResultDto {
  @ApiProperty({ description: 'Row number in CSV (1-based)', example: 1 })
  rowNumber!: number;

  @ApiProperty({ description: 'Whether row was processed successfully' })
  success!: boolean;

  @ApiPropertyOptional({ description: 'Whether row was skipped as duplicate' })
  isDuplicate?: boolean;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;

  @ApiPropertyOptional({ description: 'Warning message (e.g., total mismatch)' })
  warning?: string;

  @ApiPropertyOptional({ description: 'Matched client name' })
  clientName?: string;

  @ApiPropertyOptional({ description: 'Client match confidence score' })
  matchScore?: number;

  @ApiPropertyOptional({ description: 'Invoice number' })
  invoiceNum?: string;

  @ApiPropertyOptional({ description: 'Invoice date (ISO 8601)' })
  date?: string;

  @ApiPropertyOptional({ description: 'Income description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Subtotal in cents' })
  subtotalCents?: number;

  @ApiPropertyOptional({ description: 'GST in cents' })
  gstCents?: number;

  @ApiPropertyOptional({ description: 'Total in cents' })
  totalCents?: number;
}

/**
 * Response for income CSV import operation.
 */
export class IncomeCsvImportResponseDto {
  @ApiProperty({
    description: 'Import job ID for tracking (null for dry-run previews, which persist nothing)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    nullable: true,
  })
  importJobId!: string | null;

  @ApiProperty({ description: 'Total rows in CSV', example: 10 })
  totalRows!: number;

  @ApiProperty({ description: 'Successfully imported rows', example: 8 })
  successCount!: number;

  @ApiProperty({ description: 'Failed rows', example: 1 })
  failedCount!: number;

  @ApiProperty({ description: 'Duplicate rows skipped', example: 1 })
  duplicateCount!: number;

  @ApiProperty({ description: 'Rows with warnings', example: 1 })
  warningCount!: number;

  @ApiProperty({ description: 'Total subtotal in cents', example: 100000 })
  totalSubtotalCents!: number;

  @ApiProperty({ description: 'Total GST collected in cents', example: 10000 })
  totalGstCents!: number;

  @ApiProperty({ description: 'Total amount in cents', example: 110000 })
  totalAmountCents!: number;

  @ApiProperty({ description: 'Processing time in milliseconds', example: 150 })
  processingTimeMs!: number;

  @ApiProperty({
    description: 'Detailed results for each row',
    type: [IncomeCsvRowResultDto],
  })
  rows!: IncomeCsvRowResultDto[];
}
