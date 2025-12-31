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
import { IncomesService } from './incomes.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { Income } from './entities/income.entity';

/**
 * REST controller for Income entity operations.
 *
 * Incomes represent revenue from freelance work with automatic total calculation.
 * `totalCents` is always computed as `subtotalCents + gstCents`.
 *
 * @route /incomes
 *
 * @example
 * ```
 * POST   /incomes                     - Create a new income
 * GET    /incomes                     - List all incomes
 * GET    /incomes?clientId=uuid       - Filter by client
 * GET    /incomes?isPaid=true         - Filter by payment status
 * GET    /incomes?startDate=&endDate= - Filter by date range
 * GET    /incomes/:id                 - Get a specific income
 * PATCH  /incomes/:id                 - Update an income
 * PATCH  /incomes/:id/paid            - Mark as paid
 * PATCH  /incomes/:id/unpaid          - Mark as unpaid
 * DELETE /incomes/:id                 - Delete an income
 * ```
 */
@ApiTags('incomes')
@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  /**
   * Creates a new income with automatic total calculation.
   *
   * @route POST /incomes
   * @param createIncomeDto - The income data
   * @returns The created income with client relation
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new income',
    description: 'Creates an income with automatic total calculation (subtotal + GST).',
  })
  @ApiCreatedResponse({ description: 'Income created successfully', type: Income })
  async create(@Body() createIncomeDto: CreateIncomeDto): Promise<Income> {
    return this.incomesService.create(createIncomeDto);
  }

  /**
   * Retrieves all incomes with optional filtering.
   *
   * @route GET /incomes
   * @route GET /incomes?clientId=uuid
   * @route GET /incomes?isPaid=true
   * @route GET /incomes?startDate=2024-01-01&endDate=2024-03-31
   * @param clientId - Optional filter by client UUID
   * @param isPaid - Optional filter by payment status
   * @param startDate - Optional start date for range filter (ISO 8601)
   * @param endDate - Optional end date for range filter (ISO 8601)
   * @returns Array of incomes
   */
  @Get()
  @ApiOperation({ summary: 'Get all incomes with optional filtering' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filter by client UUID' })
  @ApiQuery({
    name: 'isPaid',
    required: false,
    description: 'Filter by payment status (true/false)',
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiOkResponse({ description: 'List of incomes', type: [Income] })
  async findAll(
    @Query('clientId') clientId?: string,
    @Query('isPaid') isPaid?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Income[]> {
    // Filter by client
    if (clientId) {
      return this.incomesService.findByClient(clientId);
    }

    // Filter by payment status
    if (isPaid !== undefined) {
      const isPaidBool = isPaid === 'true';
      return this.incomesService.findByPaymentStatus(isPaidBool);
    }

    // Filter by date range
    if (startDate && endDate) {
      return this.incomesService.findByDateRange(new Date(startDate), new Date(endDate));
    }

    // Return all
    return this.incomesService.findAll();
  }

  /**
   * Retrieves a single income by ID.
   *
   * @route GET /incomes/:id
   * @param id - The income UUID
   * @returns The income with client relation
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get an income by ID' })
  @ApiParam({ name: 'id', description: 'Income UUID' })
  @ApiOkResponse({ description: 'The income', type: Income })
  @ApiNotFoundResponse({ description: 'Income not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Income> {
    return this.incomesService.findOne(id);
  }

  /**
   * Updates an existing income.
   *
   * If subtotalCents or gstCents changes, totalCents is recalculated.
   *
   * @route PATCH /incomes/:id
   * @param id - The income UUID
   * @param updateIncomeDto - The fields to update
   * @returns The updated income
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update an income',
    description: 'Updates an income. Total is recalculated if subtotal or GST changes.',
  })
  @ApiParam({ name: 'id', description: 'Income UUID' })
  @ApiOkResponse({ description: 'Income updated successfully', type: Income })
  @ApiNotFoundResponse({ description: 'Income not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateIncomeDto: UpdateIncomeDto,
  ): Promise<Income> {
    return this.incomesService.update(id, updateIncomeDto);
  }

  /**
   * Marks an income as paid.
   *
   * @route PATCH /incomes/:id/paid
   * @param id - The income UUID
   * @returns The updated income
   */
  @Patch(':id/paid')
  @ApiOperation({ summary: 'Mark income as paid' })
  @ApiParam({ name: 'id', description: 'Income UUID' })
  @ApiOkResponse({ description: 'Income marked as paid', type: Income })
  @ApiNotFoundResponse({ description: 'Income not found' })
  async markAsPaid(@Param('id', ParseUUIDPipe) id: string): Promise<Income> {
    return this.incomesService.markAsPaid(id);
  }

  /**
   * Marks an income as unpaid.
   *
   * @route PATCH /incomes/:id/unpaid
   * @param id - The income UUID
   * @returns The updated income
   */
  @Patch(':id/unpaid')
  @ApiOperation({ summary: 'Mark income as unpaid' })
  @ApiParam({ name: 'id', description: 'Income UUID' })
  @ApiOkResponse({ description: 'Income marked as unpaid', type: Income })
  @ApiNotFoundResponse({ description: 'Income not found' })
  async markAsUnpaid(@Param('id', ParseUUIDPipe) id: string): Promise<Income> {
    return this.incomesService.markAsUnpaid(id);
  }

  /**
   * Removes an income.
   *
   * @route DELETE /incomes/:id
   * @param id - The income UUID
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an income' })
  @ApiParam({ name: 'id', description: 'Income UUID' })
  @ApiNoContentResponse({ description: 'Income deleted successfully' })
  @ApiNotFoundResponse({ description: 'Income not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.incomesService.remove(id);
  }
}
