import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';

/**
 * REST controller for Client entity operations.
 *
 * Clients represent people or companies who pay you for freelance work.
 * Sensitive fields (name, abn) are encrypted at rest.
 *
 * @route /clients
 *
 * @example
 * ```
 * POST   /clients           - Create a new client
 * GET    /clients           - List all clients (with optional filters)
 * GET    /clients/:id       - Get a specific client
 * PATCH  /clients/:id       - Update a client
 * DELETE /clients/:id       - Delete a client
 * ```
 */
@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /**
   * Creates a new client.
   *
   * @route POST /clients
   * @param createClientDto - The client data
   * @returns The created client
   */
  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiCreatedResponse({ description: 'Client created successfully', type: Client })
  async create(@Body() createClientDto: CreateClientDto): Promise<Client> {
    return this.clientsService.create(createClientDto);
  }

  /**
   * Retrieves all clients, optionally filtered by PSI eligibility.
   *
   * @route GET /clients
   * @route GET /clients?psiEligible=true
   * @param psiEligible - Optional filter for PSI-eligible clients ('true' or 'false')
   * @returns Array of clients
   */
  @Get()
  @ApiOperation({ summary: 'Get all clients' })
  @ApiQuery({
    name: 'psiEligible',
    required: false,
    description: 'Filter by PSI eligibility (true/false)',
  })
  @ApiOkResponse({ description: 'List of clients', type: [Client] })
  async findAll(@Query('psiEligible') psiEligible?: string): Promise<Client[]> {
    if (psiEligible === 'true') {
      return this.clientsService.findPsiEligible();
    }
    return this.clientsService.findAll();
  }

  /**
   * Retrieves a single client by ID.
   *
   * @route GET /clients/:id
   * @param id - The client UUID
   * @returns The client
   * @throws NotFoundException if client doesn't exist
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a client by ID' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiOkResponse({ description: 'The client', type: Client })
  @ApiNotFoundResponse({ description: 'Client not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Client> {
    return this.clientsService.findOne(id);
  }

  /**
   * Updates an existing client.
   *
   * @route PATCH /clients/:id
   * @param id - The client UUID
   * @param updateClientDto - The fields to update
   * @returns The updated client
   * @throws NotFoundException if client doesn't exist
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiOkResponse({ description: 'Client updated successfully', type: Client })
  @ApiNotFoundResponse({ description: 'Client not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    return this.clientsService.update(id, updateClientDto);
  }

  /**
   * Removes a client.
   *
   * @route DELETE /clients/:id
   * @param id - The client UUID
   * @throws NotFoundException if client doesn't exist
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiNoContentResponse({ description: 'Client deleted successfully' })
  @ApiNotFoundResponse({ description: 'Client not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.clientsService.remove(id);
  }
}
