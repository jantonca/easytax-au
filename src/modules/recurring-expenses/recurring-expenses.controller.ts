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
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RecurringExpensesService } from './recurring-expenses.service';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';
import {
  RecurringExpenseResponseDto,
  GenerateExpensesResultDto,
} from './dto/recurring-expense-response.dto';

/**
 * Controller for managing recurring expense templates.
 *
 * Provides CRUD operations for recurring expense templates and
 * an endpoint to generate expenses based on due schedules.
 */
@ApiTags('Recurring Expenses')
@Controller('recurring-expenses')
export class RecurringExpensesController {
  constructor(private readonly recurringExpensesService: RecurringExpensesService) {}

  /**
   * Creates a new recurring expense template.
   */
  @Post()
  @ApiOperation({ summary: 'Create recurring expense template' })
  @ApiBody({ type: CreateRecurringExpenseDto })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
    type: RecurringExpenseResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Provider or category not found' })
  async create(@Body() createDto: CreateRecurringExpenseDto): Promise<RecurringExpenseResponseDto> {
    const entity = await this.recurringExpensesService.create(createDto);
    const entityWithRelations = await this.recurringExpensesService.findOne(entity.id);
    return this.recurringExpensesService.toResponseDto(entityWithRelations);
  }

  /**
   * Retrieves all recurring expense templates.
   */
  @Get()
  @ApiOperation({ summary: 'Get all recurring expense templates' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter to only active templates',
  })
  @ApiResponse({
    status: 200,
    description: 'List of recurring expense templates',
    type: [RecurringExpenseResponseDto],
  })
  async findAll(@Query('activeOnly') activeOnly?: string): Promise<RecurringExpenseResponseDto[]> {
    const isActiveOnly = activeOnly === 'true';
    const entities = await this.recurringExpensesService.findAll(isActiveOnly);
    return entities.map((e) => this.recurringExpensesService.toResponseDto(e));
  }

  /**
   * Retrieves recurring expense templates that are due for generation.
   */
  @Get('due')
  @ApiOperation({ summary: 'Get recurring expenses due for generation' })
  @ApiQuery({
    name: 'asOfDate',
    required: false,
    type: String,
    description: 'Check due as of this date (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of due recurring expense templates',
    type: [RecurringExpenseResponseDto],
  })
  async findDue(@Query('asOfDate') asOfDate?: string): Promise<RecurringExpenseResponseDto[]> {
    const date = asOfDate ? new Date(asOfDate) : undefined;
    const entities = await this.recurringExpensesService.findDue(date);
    return entities.map((e) => this.recurringExpensesService.toResponseDto(e));
  }

  /**
   * Generates expenses for all due recurring expense templates.
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate expenses from due templates' })
  @ApiQuery({
    name: 'asOfDate',
    required: false,
    type: String,
    description: 'Generate expenses up to this date (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Expenses generated successfully',
    type: GenerateExpensesResultDto,
  })
  async generate(@Query('asOfDate') asOfDate?: string): Promise<GenerateExpensesResultDto> {
    const date = asOfDate ? new Date(asOfDate) : undefined;
    return this.recurringExpensesService.generateExpenses(date);
  }

  /**
   * Retrieves a single recurring expense template by ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get recurring expense template by ID' })
  @ApiParam({ name: 'id', description: 'Recurring expense UUID' })
  @ApiResponse({
    status: 200,
    description: 'The recurring expense template',
    type: RecurringExpenseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RecurringExpenseResponseDto> {
    const entity = await this.recurringExpensesService.findOne(id);
    return this.recurringExpensesService.toResponseDto(entity);
  }

  /**
   * Updates an existing recurring expense template.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update recurring expense template' })
  @ApiParam({ name: 'id', description: 'Recurring expense UUID' })
  @ApiBody({ type: UpdateRecurringExpenseDto })
  @ApiResponse({
    status: 200,
    description: 'Template updated successfully',
    type: RecurringExpenseResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateRecurringExpenseDto,
  ): Promise<RecurringExpenseResponseDto> {
    const entity = await this.recurringExpensesService.update(id, updateDto);
    const entityWithRelations = await this.recurringExpensesService.findOne(entity.id);
    return this.recurringExpensesService.toResponseDto(entityWithRelations);
  }

  /**
   * Deletes a recurring expense template.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete recurring expense template' })
  @ApiParam({ name: 'id', description: 'Recurring expense UUID' })
  @ApiResponse({ status: 204, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.recurringExpensesService.remove(id);
  }
}
