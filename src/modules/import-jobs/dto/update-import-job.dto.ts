import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ImportSource, ImportStatus } from '../entities/import-job.entity';

/**
 * DTO for updating an import job.
 * Typically used to update status and counts during/after processing.
 */
export class UpdateImportJobDto {
  /**
   * Original filename of the CSV being imported.
   */
  @ApiPropertyOptional({
    description: 'Original filename of the CSV being imported',
    example: 'commbank-transactions-2025-01.csv',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  filename?: string;

  /**
   * Bank or source of the CSV file.
   */
  @ApiPropertyOptional({
    description: 'Bank or source of the CSV file',
    enum: ImportSource,
  })
  @IsOptional()
  @IsEnum(ImportSource)
  source?: ImportSource;

  /**
   * Current status of the import job.
   */
  @ApiPropertyOptional({
    description: 'Current status of the import job',
    enum: ImportStatus,
  })
  @IsOptional()
  @IsEnum(ImportStatus)
  status?: ImportStatus;

  /**
   * Total number of rows in the CSV file.
   */
  @ApiPropertyOptional({
    description: 'Total number of rows in the CSV file',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalRows?: number;

  /**
   * Number of expenses successfully imported.
   */
  @ApiPropertyOptional({
    description: 'Number of expenses successfully imported',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  importedCount?: number;

  /**
   * Number of rows skipped (duplicates or filtered out).
   */
  @ApiPropertyOptional({
    description: 'Number of rows skipped',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  skippedCount?: number;

  /**
   * Number of rows that failed to import.
   */
  @ApiPropertyOptional({
    description: 'Number of rows that failed',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  errorCount?: number;

  /**
   * Error message if import failed.
   */
  @ApiPropertyOptional({
    description: 'Error message if import failed',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}
