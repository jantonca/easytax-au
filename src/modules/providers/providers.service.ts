import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from './entities/provider.entity';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

/**
 * Service for managing Provider entities.
 * Handles CRUD operations for vendors/providers you pay for business expenses.
 */
@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
  ) {}

  /**
   * Create a new provider.
   * @param createProviderDto - Data for creating the provider
   * @returns The created provider entity
   */
  async create(createProviderDto: CreateProviderDto): Promise<Provider> {
    const provider = this.providerRepository.create({
      name: createProviderDto.name,
      isInternational: createProviderDto.isInternational ?? false,
      defaultCategoryId: createProviderDto.defaultCategoryId,
      abnArn: createProviderDto.abnArn,
    });

    return this.providerRepository.save(provider);
  }

  /**
   * Find all providers.
   * @param international - Optional filter for international providers
   * @returns Array of all providers
   */
  async findAll(international?: boolean): Promise<Provider[]> {
    if (international !== undefined) {
      return this.providerRepository.find({
        where: { isInternational: international },
        relations: ['defaultCategory'],
        order: { name: 'ASC' },
      });
    }

    return this.providerRepository.find({
      relations: ['defaultCategory'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Find a single provider by ID.
   * @param id - The provider UUID
   * @returns The provider entity
   * @throws NotFoundException if provider not found
   */
  async findOne(id: string): Promise<Provider> {
    const provider = await this.providerRepository.findOne({
      where: { id },
      relations: ['defaultCategory'],
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID "${id}" not found`);
    }

    return provider;
  }

  /**
   * Find a provider by name (case-insensitive).
   * @param name - The provider name to search for
   * @returns The provider entity or null if not found
   */
  async findByName(name: string): Promise<Provider | null> {
    return this.providerRepository
      .createQueryBuilder('provider')
      .leftJoinAndSelect('provider.defaultCategory', 'category')
      .where('LOWER(provider.name) = LOWER(:name)', { name })
      .getOne();
  }

  /**
   * Update an existing provider.
   * @param id - The provider UUID
   * @param updateProviderDto - Data for updating the provider
   * @returns The updated provider entity
   * @throws NotFoundException if provider not found
   */
  async update(id: string, updateProviderDto: UpdateProviderDto): Promise<Provider> {
    const provider = await this.findOne(id);

    Object.assign(provider, updateProviderDto);

    return this.providerRepository.save(provider);
  }

  /**
   * Remove a provider by ID.
   * @param id - The provider UUID
   * @throws NotFoundException if provider not found
   */
  async remove(id: string): Promise<void> {
    const provider = await this.findOne(id);
    await this.providerRepository.remove(provider);
  }

  /**
   * Check if a provider exists by ID.
   * @param id - The provider UUID
   * @returns true if exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.providerRepository.count({ where: { id } });
    return count > 0;
  }

  /**
   * Find all international providers (GST-Free).
   * @returns Array of international providers
   */
  async findInternational(): Promise<Provider[]> {
    return this.findAll(true);
  }

  /**
   * Find all domestic (Australian) providers.
   * @returns Array of domestic providers
   */
  async findDomestic(): Promise<Provider[]> {
    return this.findAll(false);
  }
}
