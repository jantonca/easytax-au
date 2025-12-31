import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { Provider } from './entities/provider.entity';

/**
 * REST controller for Provider entity operations.
 * Provides endpoints for managing vendors/providers.
 *
 * @example
 * ```
 * POST   /providers           - Create a new provider
 * GET    /providers           - List all providers (with optional filters)
 * GET    /providers/:id       - Get a specific provider
 * PATCH  /providers/:id       - Update a provider
 * DELETE /providers/:id       - Delete a provider
 * ```
 */
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  /**
   * Create a new provider.
   * @param createProviderDto - Provider data
   * @returns The created provider
   */
  @Post()
  create(@Body() createProviderDto: CreateProviderDto): Promise<Provider> {
    return this.providersService.create(createProviderDto);
  }

  /**
   * Get all providers with optional filtering.
   * @param international - Filter by international status ('true' or 'false')
   * @returns Array of providers
   */
  @Get()
  findAll(@Query('international') international?: string): Promise<Provider[]> {
    if (international !== undefined) {
      const isInternational = international === 'true';
      return this.providersService.findAll(isInternational);
    }
    return this.providersService.findAll();
  }

  /**
   * Get a specific provider by ID.
   * @param id - Provider UUID
   * @returns The provider
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Provider> {
    return this.providersService.findOne(id);
  }

  /**
   * Update a provider.
   * @param id - Provider UUID
   * @param updateProviderDto - Updated provider data
   * @returns The updated provider
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProviderDto: UpdateProviderDto,
  ): Promise<Provider> {
    return this.providersService.update(id, updateProviderDto);
  }

  /**
   * Delete a provider.
   * @param id - Provider UUID
   */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.providersService.remove(id);
  }
}
