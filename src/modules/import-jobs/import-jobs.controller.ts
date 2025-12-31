import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ImportJobsService } from './import-jobs.service';
import { CreateImportJobDto } from './dto/create-import-job.dto';
import { UpdateImportJobDto } from './dto/update-import-job.dto';
import { ImportJob } from './entities/import-job.entity';

/**
 * Controller for managing import jobs.
 * Provides endpoints for CRUD operations and rollback functionality.
 */
@ApiTags('Import Jobs')
@Controller('import-jobs')
export class ImportJobsController {
  constructor(private readonly importJobsService: ImportJobsService) {}

  /**
   * Create a new import job.
   */
  @Post()
  @ApiOperation({ summary: 'Create a new import job' })
  @ApiResponse({
    status: 201,
    description: 'Import job created successfully',
    type: ImportJob,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() createDto: CreateImportJobDto): Promise<ImportJob> {
    return this.importJobsService.create(createDto);
  }

  /**
   * Get all import jobs with pagination.
   */
  @Get()
  @ApiOperation({ summary: 'Get all import jobs with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'List of import jobs',
  })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: ImportJob[]; total: number; page: number; limit: number }> {
    return this.importJobsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * Get a single import job by ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single import job by ID' })
  @ApiParam({ name: 'id', description: 'Import job UUID' })
  @ApiResponse({
    status: 200,
    description: 'The import job',
    type: ImportJob,
  })
  @ApiResponse({ status: 404, description: 'Import job not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ImportJob> {
    return this.importJobsService.findOne(id);
  }

  /**
   * Get import job with its expenses.
   */
  @Get(':id/expenses')
  @ApiOperation({ summary: 'Get import job with its associated expenses' })
  @ApiParam({ name: 'id', description: 'Import job UUID' })
  @ApiResponse({
    status: 200,
    description: 'Import job with expenses',
  })
  @ApiResponse({ status: 404, description: 'Import job not found' })
  findOneWithExpenses(@Param('id', ParseUUIDPipe) id: string): Promise<ImportJob> {
    return this.importJobsService.findOneWithExpenses(id);
  }

  /**
   * Get statistics for an import job.
   */
  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get statistics for an import job' })
  @ApiParam({ name: 'id', description: 'Import job UUID' })
  @ApiResponse({
    status: 200,
    description: 'Import job statistics',
  })
  getStatistics(@Param('id', ParseUUIDPipe) id: string): Promise<{
    totalExpenses: number;
    totalAmountCents: number;
    totalGstCents: number;
  }> {
    return this.importJobsService.getStatistics(id);
  }

  /**
   * Update an import job.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update an import job' })
  @ApiParam({ name: 'id', description: 'Import job UUID' })
  @ApiResponse({
    status: 200,
    description: 'Import job updated',
    type: ImportJob,
  })
  @ApiResponse({ status: 404, description: 'Import job not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateImportJobDto,
  ): Promise<ImportJob> {
    return this.importJobsService.update(id, updateDto);
  }

  /**
   * Rollback an import job (delete all associated expenses).
   */
  @Post(':id/rollback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rollback an import job',
    description: 'Deletes all expenses associated with this import job (hard delete)',
  })
  @ApiParam({ name: 'id', description: 'Import job UUID' })
  @ApiResponse({
    status: 200,
    description: 'Rollback successful',
  })
  @ApiResponse({ status: 400, description: 'Import job already rolled back' })
  @ApiResponse({ status: 404, description: 'Import job not found' })
  rollback(@Param('id', ParseUUIDPipe) id: string): Promise<{ deletedCount: number }> {
    return this.importJobsService.rollback(id);
  }

  /**
   * Delete an import job.
   * Only allowed if the import job has no associated expenses.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an import job',
    description: 'Only allowed if the import job has no associated expenses',
  })
  @ApiParam({ name: 'id', description: 'Import job UUID' })
  @ApiResponse({ status: 204, description: 'Import job deleted' })
  @ApiResponse({ status: 400, description: 'Import job has associated expenses' })
  @ApiResponse({ status: 404, description: 'Import job not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.importJobsService.remove(id);
  }
}
