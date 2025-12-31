import { PartialType } from '@nestjs/mapped-types';
import { CreateProviderDto } from './create-provider.dto';

/**
 * Data Transfer Object for updating an existing Provider.
 * All fields are optional (partial update support).
 *
 * @example
 * ```typescript
 * const dto: UpdateProviderDto = {
 *   isInternational: false,
 *   abnArn: '51824753556',
 * };
 * ```
 */
export class UpdateProviderDto extends PartialType(CreateProviderDto) {}
