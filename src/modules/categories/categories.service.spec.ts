import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let mockCreate: jest.Mock;
  let mockSave: jest.Mock;
  let mockFind: jest.Mock;
  let mockFindOne: jest.Mock;
  let mockRemove: jest.Mock;
  let mockCount: jest.Mock;

  const mockCategory: Category = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Software',
    basLabel: '1B',
    isDeductible: true,
    description: 'Software subscriptions',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockCreate = jest.fn();
    mockSave = jest.fn();
    mockFind = jest.fn();
    mockFindOne = jest.fn();
    mockRemove = jest.fn();
    mockCount = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            create: mockCreate,
            save: mockSave,
            find: mockFind,
            findOne: mockFindOne,
            remove: mockRemove,
            count: mockCount,
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category with all fields', async () => {
      const dto = {
        name: 'Software',
        basLabel: '1B',
        isDeductible: true,
        description: 'Software subscriptions',
      };

      mockCreate.mockReturnValue(mockCategory);
      mockSave.mockResolvedValue(mockCategory);

      const result = await service.create(dto);

      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Software',
        basLabel: '1B',
        isDeductible: true,
        description: 'Software subscriptions',
      });
      expect(mockSave).toHaveBeenCalledWith(mockCategory);
      expect(result).toEqual(mockCategory);
    });

    it('should create a category with default isDeductible', async () => {
      const dto = {
        name: 'Hardware',
        basLabel: '1B',
      };

      mockCreate.mockReturnValue(mockCategory);
      mockSave.mockResolvedValue(mockCategory);

      await service.create(dto);

      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Hardware',
        basLabel: '1B',
        isDeductible: true,
        description: null,
      });
    });
  });

  describe('findAll', () => {
    it('should return all categories ordered by name', async () => {
      const categories = [mockCategory, { ...mockCategory, id: '2', name: 'Internet' }];
      mockFind.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(mockFind).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
      expect(result).toEqual(categories);
    });

    it('should return empty array when no categories exist', async () => {
      mockFind.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a category when found', async () => {
      mockFindOne.mockResolvedValue(mockCategory);

      const result = await service.findOne(mockCategory.id);

      expect(mockFindOne).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct message', async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toMatchObject({
        message: 'Category with ID "non-existent-id" not found',
      });
    });
  });

  describe('findByBasLabel', () => {
    it('should return categories matching BAS label', async () => {
      const categories = [mockCategory];
      mockFind.mockResolvedValue(categories);

      const result = await service.findByBasLabel('1B');

      expect(mockFind).toHaveBeenCalledWith({
        where: { basLabel: '1B' },
        order: { name: 'ASC' },
      });
      expect(result).toEqual(categories);
    });
  });

  describe('update', () => {
    it('should update category name', async () => {
      const updatedCategory = { ...mockCategory, name: 'Updated Name' };
      mockFindOne.mockResolvedValue({ ...mockCategory });
      mockSave.mockResolvedValue(updatedCategory);

      const result = await service.update(mockCategory.id, { name: 'Updated Name' });

      expect(mockSave).toHaveBeenCalled();
      expect(result.name).toBe('Updated Name');
    });

    it('should update multiple fields', async () => {
      const updatedCategory = {
        ...mockCategory,
        name: 'New Name',
        basLabel: 'G10',
        isDeductible: false,
      };
      mockFindOne.mockResolvedValue({ ...mockCategory });
      mockSave.mockResolvedValue(updatedCategory);

      const result = await service.update(mockCategory.id, {
        name: 'New Name',
        basLabel: 'G10',
        isDeductible: false,
      });

      expect(result.name).toBe('New Name');
      expect(result.basLabel).toBe('G10');
      expect(result.isDeductible).toBe(false);
    });

    it('should throw NotFoundException when updating non-existent category', async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', { name: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      mockFindOne.mockResolvedValue(mockCategory);
      mockRemove.mockResolvedValue(mockCategory);

      await service.remove(mockCategory.id);

      expect(mockRemove).toHaveBeenCalledWith(mockCategory);
    });

    it('should throw NotFoundException when removing non-existent category', async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exists', () => {
    it('should return true when category exists', async () => {
      mockCount.mockResolvedValue(1);

      const result = await service.exists(mockCategory.id);

      expect(result).toBe(true);
    });

    it('should return false when category does not exist', async () => {
      mockCount.mockResolvedValue(0);

      const result = await service.exists('non-existent-id');

      expect(result).toBe(false);
    });
  });
});
