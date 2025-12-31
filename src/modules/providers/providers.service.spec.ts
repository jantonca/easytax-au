import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { Provider } from './entities/provider.entity';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

describe('ProvidersService', () => {
  let service: ProvidersService;

  const mockProvider: Provider = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'GitHub',
    isInternational: true,
    defaultCategoryId: '223e4567-e89b-12d3-a456-426614174000',
    abnArn: undefined,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Provider;

  const domesticProvider: Provider = {
    id: '323e4567-e89b-12d3-a456-426614174000',
    name: 'VentraIP',
    isInternational: false,
    abnArn: '51824753556',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Provider;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvidersService,
        {
          provide: getRepositoryToken(Provider),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProvidersService>(ProvidersService);
    repository = module.get<Repository<Provider>>(getRepositoryToken(Provider));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new provider with minimal data', async () => {
      const createDto: CreateProviderDto = {
        name: 'GitHub',
      };

      mockRepository.create.mockReturnValue({
        ...mockProvider,
        isInternational: false,
      });
      mockRepository.save.mockResolvedValue({
        ...mockProvider,
        isInternational: false,
      });

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'GitHub',
        isInternational: false,
        defaultCategoryId: undefined,
        abnArn: undefined,
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('GitHub');
    });

    it('should create an international provider', async () => {
      const createDto: CreateProviderDto = {
        name: 'GitHub',
        isInternational: true,
        defaultCategoryId: '223e4567-e89b-12d3-a456-426614174000',
      };

      mockRepository.create.mockReturnValue(mockProvider);
      mockRepository.save.mockResolvedValue(mockProvider);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'GitHub',
        isInternational: true,
        defaultCategoryId: '223e4567-e89b-12d3-a456-426614174000',
        abnArn: undefined,
      });
      expect(result.isInternational).toBe(true);
    });

    it('should create a domestic provider with ABN', async () => {
      const createDto: CreateProviderDto = {
        name: 'VentraIP',
        isInternational: false,
        abnArn: '51824753556',
      };

      mockRepository.create.mockReturnValue(domesticProvider);
      mockRepository.save.mockResolvedValue(domesticProvider);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'VentraIP',
        isInternational: false,
        defaultCategoryId: undefined,
        abnArn: '51824753556',
      });
      expect(result.abnArn).toBe('51824753556');
    });
  });

  describe('findAll', () => {
    it('should return all providers', async () => {
      const providers = [mockProvider, domesticProvider];
      mockRepository.find.mockResolvedValue(providers);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['defaultCategory'],
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by international=true', async () => {
      mockRepository.find.mockResolvedValue([mockProvider]);

      const result = await service.findAll(true);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isInternational: true },
        relations: ['defaultCategory'],
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].isInternational).toBe(true);
    });

    it('should filter by international=false', async () => {
      mockRepository.find.mockResolvedValue([domesticProvider]);

      const result = await service.findAll(false);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isInternational: false },
        relations: ['defaultCategory'],
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].isInternational).toBe(false);
    });
  });

  describe('findOne', () => {
    it('should return a provider by ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockProvider);

      const result = await service.findOne(mockProvider.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockProvider.id },
        relations: ['defaultCategory'],
      });
      expect(result.id).toBe(mockProvider.id);
    });

    it('should throw NotFoundException if provider not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByName', () => {
    it('should return a provider by name (case-insensitive)', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockProvider),
      };
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findByName('github');

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('provider');
      expect(queryBuilder.where).toHaveBeenCalledWith('LOWER(provider.name) = LOWER(:name)', {
        name: 'github',
      });
      expect(result).toEqual(mockProvider);
    });

    it('should return null if provider not found by name', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findByName('NonExistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a provider', async () => {
      const updateDto: UpdateProviderDto = {
        name: 'GitHub Enterprise',
      };

      mockRepository.findOne.mockResolvedValue({ ...mockProvider });
      mockRepository.save.mockResolvedValue({
        ...mockProvider,
        name: 'GitHub Enterprise',
      });

      const result = await service.update(mockProvider.id, updateDto);

      expect(result.name).toBe('GitHub Enterprise');
    });

    it('should update isInternational flag', async () => {
      const updateDto: UpdateProviderDto = {
        isInternational: false,
        abnArn: '12345678901',
      };

      mockRepository.findOne.mockResolvedValue({ ...mockProvider });
      mockRepository.save.mockResolvedValue({
        ...mockProvider,
        isInternational: false,
        abnArn: '12345678901',
      });

      const result = await service.update(mockProvider.id, updateDto);

      expect(result.isInternational).toBe(false);
      expect(result.abnArn).toBe('12345678901');
    });

    it('should throw NotFoundException if provider not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a provider', async () => {
      mockRepository.findOne.mockResolvedValue(mockProvider);
      mockRepository.remove.mockResolvedValue(mockProvider);

      await service.remove(mockProvider.id);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockProvider);
    });

    it('should throw NotFoundException if provider not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exists', () => {
    it('should return true if provider exists', async () => {
      mockRepository.count.mockResolvedValue(1);

      const result = await service.exists(mockProvider.id);

      expect(result).toBe(true);
    });

    it('should return false if provider does not exist', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.exists('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('findInternational', () => {
    it('should return only international providers', async () => {
      mockRepository.find.mockResolvedValue([mockProvider]);

      const result = await service.findInternational();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isInternational: true },
        relations: ['defaultCategory'],
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findDomestic', () => {
    it('should return only domestic providers', async () => {
      mockRepository.find.mockResolvedValue([domesticProvider]);

      const result = await service.findDomestic();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isInternational: false },
        relations: ['defaultCategory'],
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(1);
    });
  });
});
