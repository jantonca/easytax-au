import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImportSource } from '../entities/import-job.entity';

/**
 * DTO for creating a new import job.
 * Used when initiating a CSV import.
 */
export class CreateImportJobDto {
  /**
   * Original filename of the CSV being imported.
   * @example "commbank-transactions-2025-01.csv"
   */
  @ApiProperty({
    description: 'Original filename of the CSV being imported',
    example: 'commbank-transactions-2025-01.csv',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename!: string;

  /**
   * Bank or source of the CSV file.
   * Determines column mapping and parsing rules.
   * @default ImportSource.MANUAL
   */
  @ApiPropertyOptional({
    description: 'Bank or source of the CSV file',
    enum: ImportSource,
    default: ImportSource.MANUAL,
  })
  @IsOptional()
  @IsEnum(ImportSource)
  source?: ImportSource;
}
