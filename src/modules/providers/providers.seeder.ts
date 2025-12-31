import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from './entities/provider.entity';
import { Category } from '../categories/entities/category.entity';

/**
 * Seed data configuration for a provider.
 */
interface ProviderSeed {
  name: string;
  isInternational: boolean;
  categoryName?: string;
  abnArn?: string;
}

/**
 * Seeder service for populating default providers.
 * Runs on application startup to ensure seed data exists.
 */
@Injectable()
export class ProvidersSeeder implements OnModuleInit {
  private readonly logger = new Logger(ProvidersSeeder.name);

  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seed();
  }

  /**
   * Seeds default providers if they don't already exist.
   * Links providers to their default categories by category name.
   */
  async seed(): Promise<void> {
    const existingCount = await this.providerRepository.count();

    if (existingCount > 0) {
      this.logger.log(
        `Skipping provider seeding - ${existingCount} providers already exist`,
      );
      return;
    }

    this.logger.log('Seeding default providers...');

    // Define seed data per SCHEMA.md
    const seedData: ProviderSeed[] = [
      {
        name: 'VentraIP',
        isInternational: false,
        categoryName: 'Hosting',
        abnArn: '93166330331',
      },
      {
        name: 'iinet',
        isInternational: false,
        categoryName: 'Internet',
        abnArn: '48068628937',
      },
      { name: 'GitHub', isInternational: true, categoryName: 'Software' },
      { name: 'Warp', isInternational: true, categoryName: 'Software' },
      {
        name: 'Bytedance (Trae)',
        isInternational: true,
        categoryName: 'Software',
      },
      { name: 'NordVPN', isInternational: true, categoryName: 'VPN' },
      {
        name: 'Google Workspace',
        isInternational: true,
        categoryName: 'Software',
      },
      { name: 'JetBrains', isInternational: true, categoryName: 'Software' },
      {
        name: 'Apple (App Store)',
        isInternational: true,
        categoryName: 'Software',
      },
      { name: 'Amazon AWS', isInternational: true, categoryName: 'Hosting' },
    ];

    // Build a map of category name -> category ID (case-insensitive)
    const categories = await this.categoryRepository.find();
    const categoryMap = new Map<string, string>();
    for (const category of categories) {
      categoryMap.set(category.name.toLowerCase(), category.id);
    }

    // Create providers with their default categories
    const providers: Partial<Provider>[] = [];

    for (const seed of seedData) {
      const provider: Partial<Provider> = {
        name: seed.name,
        isInternational: seed.isInternational,
        abnArn: seed.abnArn,
      };

      if (seed.categoryName) {
        const categoryId = categoryMap.get(seed.categoryName.toLowerCase());
        if (categoryId) {
          provider.defaultCategoryId = categoryId;
        } else {
          this.logger.warn(
            `Category "${seed.categoryName}" not found for provider "${seed.name}"`,
          );
        }
      }

      providers.push(provider);
    }

    await this.providerRepository.save(providers);

    this.logger.log(`Seeded ${providers.length} default providers`);
  }
}
