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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

/**
 * Controller for category CRUD operations.
 *
 * Categories are used to classify expenses and map them to
 * ATO BAS labels for tax reporting.
 *
 * @route /categories
 */
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Creates a new category.
   *
   * @route POST /categories
   * @param createCategoryDto - The category data
   * @returns The created category
   */
  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(createCategoryDto);
  }

  /**
   * Retrieves all categories, optionally filtered by BAS label.
   *
   * @route GET /categories
   * @route GET /categories?basLabel=1B
   * @param basLabel - Optional BAS label filter
   * @returns Array of categories
   */
  @Get()
  async findAll(@Query('basLabel') basLabel?: string): Promise<Category[]> {
    if (basLabel) {
      return this.categoriesService.findByBasLabel(basLabel);
    }
    return this.categoriesService.findAll();
  }

  /**
   * Retrieves a single category by ID.
   *
   * @route GET /categories/:id
   * @param id - The category UUID
   * @returns The category
   * @throws NotFoundException if category doesn't exist
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Category> {
    return this.categoriesService.findOne(id);
  }

  /**
   * Updates an existing category.
   *
   * @route PATCH /categories/:id
   * @param id - The category UUID
   * @param updateCategoryDto - The fields to update
   * @returns The updated category
   * @throws NotFoundException if category doesn't exist
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  /**
   * Removes a category.
   *
   * @route DELETE /categories/:id
   * @param id - The category UUID
   * @throws NotFoundException if category doesn't exist
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.categoriesService.remove(id);
  }
}
