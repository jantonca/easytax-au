import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

/**
 * Default categories for Australian business expenses.
 * These map to ATO BAS labels for tax reporting.
 */
const DEFAULT_CATEGORIES = [
  {
    name: 'Software',
    basLabel: '1B',
    isDeductible: true,
    description: 'Software subscriptions and licenses (SaaS, tools, etc.)',
  },
  {
    name: 'Hosting',
    basLabel: '1B',
    isDeductible: true,
    description: 'Web hosting, cloud services, servers',
  },
  {
    name: 'Internet',
    basLabel: '1B',
    isDeductible: true,
    description: 'Internet service provider fees',
  },
  {
    name: 'VPN',
    basLabel: '1B',
    isDeductible: true,
    description: 'VPN services for security',
  },
  {
    name: 'Hardware',
    basLabel: '1B',
    isDeductible: true,
    description: 'Computer equipment, peripherals, devices',
  },
  {
    name: 'Office Supplies',
    basLabel: '1B',
    isDeductible: true,
    description: 'Stationery, office consumables',
  },
  {
    name: 'Professional Development',
    basLabel: '1B',
    isDeductible: true,
    description: 'Courses, training, certifications',
  },
  {
    name: 'Subscriptions',
    basLabel: '1B',
    isDeductible: true,
    description: 'Business magazines, newsletters, memberships',
  },
  {
    name: 'Domain & DNS',
    basLabel: '1B',
    isDeductible: true,
    description: 'Domain registration, DNS services',
  },
  {
    name: 'Insurance',
    basLabel: '1B',
    isDeductible: true,
    description: 'Professional indemnity, public liability',
  },
  {
    name: 'Accounting',
    basLabel: '1B',
    isDeductible: true,
    description: 'Accountant fees, tax agent services',
  },
  {
    name: 'Bank Fees',
    basLabel: '1B',
    isDeductible: true,
    description: 'Business bank account fees',
  },
  {
    name: 'Capital Purchases',
    basLabel: 'G10',
    isDeductible: true,
    description: 'Capital acquisitions over $1,000',
  },
  {
    name: 'Non-Deductible',
    basLabel: 'N/A',
    isDeductible: false,
    description: 'Personal or non-deductible expenses',
  },
];

/**
 * Seeds default categories on application startup.
 * Only inserts categories that don't already exist (by name).
 */
@Injectable()
export class CategoriesSeeder implements OnModuleInit {
  private readonly logger = new Logger(CategoriesSeeder.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seed();
  }

  /**
   * Seeds default categories if they don't exist.
   * Uses name as the unique identifier to avoid duplicates.
   */
  async seed(): Promise<void> {
    const existingCount = await this.categoryRepository.count();

    if (existingCount > 0) {
      this.logger.log(`Categories already seeded (${existingCount} found), skipping...`);
      return;
    }

    this.logger.log('Seeding default categories...');

    for (const categoryData of DEFAULT_CATEGORIES) {
      const category = this.categoryRepository.create(categoryData);
      await this.categoryRepository.save(category);
    }

    this.logger.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories`);
  }
}
