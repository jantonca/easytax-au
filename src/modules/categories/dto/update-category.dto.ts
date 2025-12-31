import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';

/**
 * DTO for updating an existing category.
 *
 * All fields are optional - only provided fields will be updated.
 *
 * @example
 * ```json
 * {
 *   "name": "Software & SaaS",
 *   "description": "Updated description"
 * }
 * ```
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
