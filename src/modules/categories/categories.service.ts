import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

/**
 * Service for managing expense categories.
 *
 * Provides CRUD operations for categories which map expenses
 * to ATO BAS labels for tax reporting.
 */
@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Creates a new category.
   *
   * @param createCategoryDto - The category data
   * @returns The created category
   */
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create({
      name: createCategoryDto.name,
      basLabel: createCategoryDto.basLabel,
      isDeductible: createCategoryDto.isDeductible ?? true,
      description: createCategoryDto.description ?? null,
    });
    return this.categoryRepository.save(category);
  }

  /**
   * Retrieves all categories.
   *
   * @returns Array of all categories, ordered by name
   */
  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Retrieves a single category by ID.
   *
   * @param id - The category UUID
   * @returns The category
   * @throws NotFoundException if category doesn't exist
   */
  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return category;
  }

  /**
   * Retrieves categories by BAS label.
   *
   * @param basLabel - The ATO BAS label (e.g., "1B")
   * @returns Array of matching categories
   */
  async findByBasLabel(basLabel: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { basLabel },
      order: { name: 'ASC' },
    });
  }

  /**
   * Updates an existing category.
   *
   * @param id - The category UUID
   * @param updateCategoryDto - The fields to update
   * @returns The updated category
   * @throws NotFoundException if category doesn't exist
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    // Merge provided fields into existing category
    Object.assign(category, updateCategoryDto);

    return this.categoryRepository.save(category);
  }

  /**
   * Removes a category.
   *
   * @param id - The category UUID
   * @throws NotFoundException if category doesn't exist
   */
  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }

  /**
   * Checks if a category exists by ID.
   *
   * @param id - The category UUID
   * @returns true if exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.categoryRepository.count({ where: { id } });
    return count > 0;
  }
}
