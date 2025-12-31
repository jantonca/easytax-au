import { PartialType } from '@nestjs/mapped-types';
import { CreateClientDto } from './create-client.dto';

/**
 * DTO for updating an existing client.
 *
 * All fields are optional - only provided fields will be updated.
 *
 * @example
 * ```json
 * {
 *   "name": "Acme Corp (Updated)",
 *   "isPsiEligible": true
 * }
 * ```
 */
export class UpdateClientDto extends PartialType(CreateClientDto) {}
