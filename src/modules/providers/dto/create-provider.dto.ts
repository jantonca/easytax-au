import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

/**
 * Data Transfer Object for creating a new Provider.
 *
 * @example
 * ```typescript
 * const dto: CreateProviderDto = {
 *   name: 'GitHub',
 *   isInternational: true,
 *   defaultCategoryId: '123e4567-e89b-12d3-a456-426614174000',
 * };
 * ```
 */
export class CreateProviderDto {
  /**
   * Provider/vendor name (1-100 characters)
   * @example "GitHub"
   */
  @ApiProperty({ description: 'Provider name', example: 'GitHub', minLength: 1, maxLength: 100 })
  @IsString()
  @MinLength(1, { message: 'Name must not be empty' })
  @MaxLength(100, { message: 'Name must be at most 100 characters' })
  name!: string;

  /**
   * Whether the provider is international (non-Australian).
   * International providers are GST-Free.
   * @default false
   */
  @ApiPropertyOptional({
    description: 'International provider (GST-free)',
    default: false,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isInternational?: boolean;

  /**
   * UUID of the default category for this provider.
   * Expenses from this provider will auto-assign this category.
   */
  @ApiPropertyOptional({
    description: 'Default category UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Default category ID must be a valid UUID' })
  @IsOptional()
  defaultCategoryId?: string;

  /**
   * Australian Business Number (11 digits) or Australian Registered Number (9 digits).
   * Required for Australian providers to claim GST credits.
   * @example "51824753556"
   */
  @ApiPropertyOptional({
    description: 'ABN (11 digits) or ARN (9 digits)',
    example: '51824753556',
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{9}$|^\d{11}$/, {
    message: 'ABN must be 11 digits or ARN must be 9 digits',
  })
  abnArn?: string;
}
