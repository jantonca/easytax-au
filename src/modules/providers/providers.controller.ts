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
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  /**
   * Create a new provider.
   * @param createProviderDto - Provider data
   * @returns The created provider
   */
  @Post()
  @ApiOperation({ summary: 'Create a new provider' })
  @ApiCreatedResponse({ description: 'Provider created successfully', type: Provider })
  create(@Body() createProviderDto: CreateProviderDto): Promise<Provider> {
    return this.providersService.create(createProviderDto);
  }

  /**
   * Get all providers with optional filtering.
   * @param international - Filter by international status ('true' or 'false')
   * @returns Array of providers
   */
  @Get()
  @ApiOperation({ summary: 'Get all providers' })
  @ApiQuery({
    name: 'international',
    required: false,
    description: 'Filter by international status (true/false)',
  })
  @ApiOkResponse({ description: 'List of providers', type: [Provider] })
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
  @ApiOperation({ summary: 'Get a provider by ID' })
  @ApiParam({ name: 'id', description: 'Provider UUID' })
  @ApiOkResponse({ description: 'The provider', type: Provider })
  @ApiNotFoundResponse({ description: 'Provider not found' })
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
  @ApiOperation({ summary: 'Update a provider' })
  @ApiParam({ name: 'id', description: 'Provider UUID' })
  @ApiOkResponse({ description: 'Provider updated successfully', type: Provider })
  @ApiNotFoundResponse({ description: 'Provider not found' })
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
  @ApiOperation({ summary: 'Delete a provider' })
  @ApiParam({ name: 'id', description: 'Provider UUID' })
  @ApiNoContentResponse({ description: 'Provider deleted successfully' })
  @ApiNotFoundResponse({ description: 'Provider not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.providersService.remove(id);
  }
}
