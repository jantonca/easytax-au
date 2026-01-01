import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { Expense } from './entities/expense.entity';
import { Provider } from '../providers/entities/provider.entity';
import { Category } from '../categories/entities/category.entity';
import { MoneyService } from '../../common/services/money.service';
import { FYService } from '../../common/services/fy.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

describe('ExpensesService', () => {
  let service: ExpensesService;

  // Mock data
  const domesticProvider: Provider = {
    id: '111e4567-e89b-12d3-a456-426614174000',
    name: 'VentraIP',
    isInternational: false,
    abnArn: '93166330331',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Provider;

  const internationalProvider: Provider = {
    id: '222e4567-e89b-12d3-a456-426614174000',
    name: 'GitHub',
    isInternational: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Provider;

  const mockCategory: Category = {
    id: '333e4567-e89b-12d3-a456-426614174000',
    name: 'Software',
    basLabel: '1B',
    isDeductible: true,
    description: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockExpense: Expense = {
    id: '444e4567-e89b-12d3-a456-426614174000',
    date: new Date('2024-01-15'),
    amountCents: 11000,
    gstCents: 1000,
    bizPercent: 100,
    currency: 'AUD',
    description: 'Test expense',
    fileRef: null,
    providerId: domesticProvider.id,
    provider: domesticProvider,
    categoryId: mockCategory.id,
    category: mockCategory,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockExpenseRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const mockProviderRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockCategoryRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        MoneyService,
        FYService,
        {
          provide: getRepositoryToken(Expense),
          useValue: mockExpenseRepository,
        },
        {
          provide: getRepositoryToken(Provider),
          useValue: mockProviderRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create expense with domestic provider and auto-calculate GST', async () => {
      const createDto: CreateExpenseDto = {
        date: '2024-01-15',
        amountCents: 11000,
        providerId: domesticProvider.id,
        categoryId: mockCategory.id,
        description: 'Test expense',
      };

      mockProviderRepository.findOne.mockResolvedValue(domesticProvider);
      mockCategoryRepository.count.mockResolvedValue(1);
      mockExpenseRepository.create.mockReturnValue(mockExpense);
      mockExpenseRepository.save.mockResolvedValue(mockExpense);
      mockExpenseRepository.findOne.mockResolvedValue(mockExpense);

      const result = await service.create(createDto);

      expect(mockExpenseRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amountCents: 11000,
          gstCents: 1000, // Auto-calculated: 11000 / 11 = 1000
          bizPercent: 100,
        }),
      );
      expect(result).toEqual(mockExpense);
    });

    it('should create expense with international provider and GST = 0', async () => {
      const createDto: CreateExpenseDto = {
        date: '2024-01-15',
        amountCents: 1900, // ~$19 USD
        gstCents: 500, // User provides GST (should be overridden)
        providerId: internationalProvider.id,
        categoryId: mockCategory.id,
      };

      const internationalExpense = {
        ...mockExpense,
        gstCents: 0,
        provider: internationalProvider,
        providerId: internationalProvider.id,
      };

      mockProviderRepository.findOne.mockResolvedValue(internationalProvider);
      mockCategoryRepository.count.mockResolvedValue(1);
      mockExpenseRepository.create.mockReturnValue(internationalExpense);
      mockExpenseRepository.save.mockResolvedValue(internationalExpense);
      mockExpenseRepository.findOne.mockResolvedValue(internationalExpense);

      const result = await service.create(createDto);

      expect(mockExpenseRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          gstCents: 0, // Overridden to 0 for international
        }),
      );
      expect(result.gstCents).toBe(0);
    });

    it('should create expense with provided GST for domestic provider', async () => {
      const createDto: CreateExpenseDto = {
        date: '2024-01-15',
        amountCents: 11000,
        gstCents: 950, // Exact GST from receipt (not 1000)
        providerId: domesticProvider.id,
        categoryId: mockCategory.id,
      };

      const expenseWithExactGst = { ...mockExpense, gstCents: 950 };

      mockProviderRepository.findOne.mockResolvedValue(domesticProvider);
      mockCategoryRepository.count.mockResolvedValue(1);
      mockExpenseRepository.create.mockReturnValue(expenseWithExactGst);
      mockExpenseRepository.save.mockResolvedValue(expenseWithExactGst);
      mockExpenseRepository.findOne.mockResolvedValue(expenseWithExactGst);

      const result = await service.create(createDto);

      expect(mockExpenseRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          gstCents: 950, // Use provided value
        }),
      );
      expect(result.gstCents).toBe(950);
    });

    it('should create expense with 50% business use', async () => {
      const createDto: CreateExpenseDto = {
        date: '2024-01-15',
        amountCents: 11000,
        bizPercent: 50,
        providerId: domesticProvider.id,
        categoryId: mockCategory.id,
      };

      const halfBizExpense = { ...mockExpense, bizPercent: 50 };

      mockProviderRepository.findOne.mockResolvedValue(domesticProvider);
      mockCategoryRepository.count.mockResolvedValue(1);
      mockExpenseRepository.create.mockReturnValue(halfBizExpense);
      mockExpenseRepository.save.mockResolvedValue(halfBizExpense);
      mockExpenseRepository.findOne.mockResolvedValue(halfBizExpense);

      const result = await service.create(createDto);

      expect(mockExpenseRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          bizPercent: 50,
        }),
      );
      expect(result.bizPercent).toBe(50);
    });

    it('should throw NotFoundException if provider not found', async () => {
      const createDto: CreateExpenseDto = {
        date: '2024-01-15',
        amountCents: 11000,
        providerId: 'non-existent-id',
        categoryId: mockCategory.id,
      };

      mockProviderRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if category not found', async () => {
      const createDto: CreateExpenseDto = {
        date: '2024-01-15',
        amountCents: 11000,
        providerId: domesticProvider.id,
        categoryId: 'non-existent-id',
      };

      mockProviderRepository.findOne.mockResolvedValue(domesticProvider);
      mockCategoryRepository.count.mockResolvedValue(0);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if GST exceeds amount', async () => {
      const createDto: CreateExpenseDto = {
        date: '2024-01-15',
        amountCents: 1000,
        gstCents: 2000, // GST > amount
        providerId: domesticProvider.id,
        categoryId: mockCategory.id,
      };

      mockProviderRepository.findOne.mockResolvedValue(domesticProvider);
      mockCategoryRepository.count.mockResolvedValue(1);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all expenses ordered by date descending', async () => {
      const expenses = [mockExpense, { ...mockExpense, id: '555' }];
      mockExpenseRepository.find.mockResolvedValue(expenses);

      const result = await service.findAll();

      expect(mockExpenseRepository.find).toHaveBeenCalledWith({
        relations: ['provider', 'category'],
        order: { date: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return an expense by ID', async () => {
      mockExpenseRepository.findOne.mockResolvedValue(mockExpense);

      const result = await service.findOne(mockExpense.id);

      expect(mockExpenseRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockExpense.id },
        relations: ['provider', 'category'],
      });
      expect(result).toEqual(mockExpense);
    });

    it('should throw NotFoundException if expense not found', async () => {
      mockExpenseRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByDateRange', () => {
    it('should return expenses within date range', async () => {
      const expenses = [mockExpense];
      mockExpenseRepository.find.mockResolvedValue(expenses);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-31');

      const result = await service.findByDateRange(startDate, endDate);

      expect(mockExpenseRepository.find).toHaveBeenCalledWith({
        where: {
          date: expect.anything(), // Between operator
        },
        relations: ['provider', 'category'],
        order: { date: 'DESC' },
      });
      expect(result).toEqual(expenses);
    });
  });

  describe('findByCategory', () => {
    it('should return expenses by category', async () => {
      const expenses = [mockExpense];
      mockExpenseRepository.find.mockResolvedValue(expenses);

      const result = await service.findByCategory(mockCategory.id);

      expect(mockExpenseRepository.find).toHaveBeenCalledWith({
        where: { categoryId: mockCategory.id },
        relations: ['provider', 'category'],
        order: { date: 'DESC' },
      });
      expect(result).toEqual(expenses);
    });
  });

  describe('update', () => {
    it('should update expense fields', async () => {
      const updateDto: UpdateExpenseDto = {
        amountCents: 12100,
        description: 'Updated description',
      };
      const updatedExpense = {
        ...mockExpense,
        amountCents: 12100,
        description: 'Updated description',
      };

      mockExpenseRepository.findOne.mockResolvedValue({ ...mockExpense });
      mockExpenseRepository.save.mockResolvedValue(updatedExpense);
      mockExpenseRepository.findOne
        .mockResolvedValueOnce({ ...mockExpense })
        .mockResolvedValueOnce(updatedExpense);

      const result = await service.update(mockExpense.id, updateDto);

      expect(mockExpenseRepository.save).toHaveBeenCalled();
      expect(result.amountCents).toBe(12100);
    });

    it('should reset GST to 0 when provider changes to international', async () => {
      const updateDto: UpdateExpenseDto = {
        providerId: internationalProvider.id,
      };

      mockExpenseRepository.findOne.mockResolvedValue({ ...mockExpense });
      mockProviderRepository.findOne.mockResolvedValue(internationalProvider);

      const updatedExpense = {
        ...mockExpense,
        gstCents: 0,
        providerId: internationalProvider.id,
        provider: internationalProvider,
      };
      mockExpenseRepository.save.mockResolvedValue(updatedExpense);
      mockExpenseRepository.findOne
        .mockResolvedValueOnce({ ...mockExpense })
        .mockResolvedValueOnce(updatedExpense);

      const result = await service.update(mockExpense.id, updateDto);

      expect(result.gstCents).toBe(0);
    });

    it('should throw NotFoundException when updating non-existent expense', async () => {
      mockExpenseRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', { amountCents: 1000 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if updated GST exceeds amount', async () => {
      const updateDto: UpdateExpenseDto = {
        gstCents: 50000, // Greater than amountCents
      };

      mockExpenseRepository.findOne.mockResolvedValue({ ...mockExpense });

      await expect(service.update(mockExpense.id, updateDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove an expense', async () => {
      mockExpenseRepository.findOne.mockResolvedValue(mockExpense);
      mockExpenseRepository.remove.mockResolvedValue(mockExpense);

      await service.remove(mockExpense.id);

      expect(mockExpenseRepository.remove).toHaveBeenCalledWith(mockExpense);
    });

    it('should throw NotFoundException when removing non-existent expense', async () => {
      mockExpenseRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exists', () => {
    it('should return true if expense exists', async () => {
      mockExpenseRepository.count.mockResolvedValue(1);

      const result = await service.exists(mockExpense.id);

      expect(result).toBe(true);
    });

    it('should return false if expense does not exist', async () => {
      mockExpenseRepository.count.mockResolvedValue(0);

      const result = await service.exists('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('calculateClaimableGst', () => {
    it('should calculate claimable GST with 100% business use', () => {
      const expense = { ...mockExpense, gstCents: 1000, bizPercent: 100 };

      const result = service.calculateClaimableGst(expense as Expense);

      expect(result).toBe(1000);
    });

    it('should calculate claimable GST with 50% business use', () => {
      const expense = { ...mockExpense, gstCents: 1000, bizPercent: 50 };

      const result = service.calculateClaimableGst(expense as Expense);

      expect(result).toBe(500);
    });

    it('should return 0 for 0% business use', () => {
      const expense = { ...mockExpense, gstCents: 1000, bizPercent: 0 };

      const result = service.calculateClaimableGst(expense as Expense);

      expect(result).toBe(0);
    });
  });

  describe('toResponseDto', () => {
    it('should transform expense to response DTO with FY info for Q1', () => {
      // August 2025 = Q1 FY2026
      const expense = {
        ...mockExpense,
        date: new Date('2025-08-15'),
      } as Expense;

      const result = service.toResponseDto(expense);

      expect(result.id).toBe(mockExpense.id);
      expect(result.date).toEqual(new Date('2025-08-15'));
      expect(result.amountCents).toBe(11000);
      expect(result.gstCents).toBe(1000);
      expect(result.bizPercent).toBe(100);
      expect(result.financialYear).toBe(2026);
      expect(result.quarter).toBe('Q1');
      expect(result.fyLabel).toBe('FY2026');
      expect(result.quarterLabel).toBe('Q1 FY2026');
    });

    it('should transform expense to response DTO with FY info for Q2', () => {
      // November 2025 = Q2 FY2026
      const expense = {
        ...mockExpense,
        date: new Date('2025-11-15'),
      } as Expense;

      const result = service.toResponseDto(expense);

      expect(result.financialYear).toBe(2026);
      expect(result.quarter).toBe('Q2');
      expect(result.fyLabel).toBe('FY2026');
      expect(result.quarterLabel).toBe('Q2 FY2026');
    });

    it('should transform expense to response DTO with FY info for Q3', () => {
      // February 2026 = Q3 FY2026
      const expense = {
        ...mockExpense,
        date: new Date('2026-02-15'),
      } as Expense;

      const result = service.toResponseDto(expense);

      expect(result.financialYear).toBe(2026);
      expect(result.quarter).toBe('Q3');
      expect(result.fyLabel).toBe('FY2026');
      expect(result.quarterLabel).toBe('Q3 FY2026');
    });

    it('should transform expense to response DTO with FY info for Q4', () => {
      // May 2026 = Q4 FY2026
      const expense = {
        ...mockExpense,
        date: new Date('2026-05-15'),
      } as Expense;

      const result = service.toResponseDto(expense);

      expect(result.financialYear).toBe(2026);
      expect(result.quarter).toBe('Q4');
      expect(result.fyLabel).toBe('FY2026');
      expect(result.quarterLabel).toBe('Q4 FY2026');
    });

    it('should include provider details when relation is loaded', () => {
      const expense = {
        ...mockExpense,
        provider: domesticProvider,
      } as Expense;

      const result = service.toResponseDto(expense);

      expect(result.provider).toEqual({
        id: domesticProvider.id,
        name: domesticProvider.name,
        isInternational: domesticProvider.isInternational,
      });
    });

    it('should include category details when relation is loaded', () => {
      const expense = {
        ...mockExpense,
        category: mockCategory,
      } as Expense;

      const result = service.toResponseDto(expense);

      expect(result.category).toEqual({
        id: mockCategory.id,
        name: mockCategory.name,
        basLabel: mockCategory.basLabel,
      });
    });

    it('should handle expense without loaded relations', () => {
      const expense = {
        ...mockExpense,
        provider: undefined,
        category: undefined,
      } as unknown as Expense;

      const result = service.toResponseDto(expense);

      expect(result.provider).toBeUndefined();
      expect(result.category).toBeUndefined();
    });

    it('should handle FY boundary correctly (June 30 vs July 1)', () => {
      // June 30, 2025 = Q4 FY2025
      const expenseJune = {
        ...mockExpense,
        date: new Date('2025-06-30'),
      } as Expense;

      // July 1, 2025 = Q1 FY2026
      const expenseJuly = {
        ...mockExpense,
        date: new Date('2025-07-01'),
      } as Expense;

      const resultJune = service.toResponseDto(expenseJune);
      const resultJuly = service.toResponseDto(expenseJuly);

      expect(resultJune.financialYear).toBe(2025);
      expect(resultJune.quarter).toBe('Q4');

      expect(resultJuly.financialYear).toBe(2026);
      expect(resultJuly.quarter).toBe('Q1');
    });
  });

  describe('toResponseDtoArray', () => {
    it('should transform array of expenses to response DTOs', () => {
      const expenses = [
        { ...mockExpense, id: '1', date: new Date('2025-08-15') },
        { ...mockExpense, id: '2', date: new Date('2025-11-15') },
        { ...mockExpense, id: '3', date: new Date('2026-02-15') },
      ] as Expense[];

      const result = service.toResponseDtoArray(expenses);

      expect(result).toHaveLength(3);
      expect(result[0].quarter).toBe('Q1');
      expect(result[1].quarter).toBe('Q2');
      expect(result[2].quarter).toBe('Q3');
    });

    it('should return empty array for empty input', () => {
      const result = service.toResponseDtoArray([]);

      expect(result).toEqual([]);
    });
  });
});
