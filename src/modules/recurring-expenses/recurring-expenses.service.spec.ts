import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RecurringExpensesService } from './recurring-expenses.service';
import { RecurringExpense, RecurringSchedule } from './entities/recurring-expense.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Provider } from '../providers/entities/provider.entity';
import { Category } from '../categories/entities/category.entity';
import { MoneyService } from '../../common/services/money.service';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';

describe('RecurringExpensesService', () => {
  let service: RecurringExpensesService;
  let recurringExpenseRepository: jest.Mocked<Repository<RecurringExpense>>;
  let expenseRepository: jest.Mocked<Repository<Expense>>;
  let providerRepository: jest.Mocked<Repository<Provider>>;
  let categoryRepository: jest.Mocked<Repository<Category>>;

  const mockDomesticProvider: Partial<Provider> = {
    id: 'provider-domestic-uuid',
    name: 'iinet',
    isInternational: false,
  };

  const mockInternationalProvider: Partial<Provider> = {
    id: 'provider-intl-uuid',
    name: 'GitHub',
    isInternational: true,
  };

  const mockCategory: Partial<Category> = {
    id: 'category-uuid',
    name: 'Internet',
    basLabel: '1B',
  };

  const mockRecurringExpense: Partial<RecurringExpense> = {
    id: 'recurring-uuid',
    name: 'iinet Internet',
    description: 'Monthly internet service',
    amountCents: 8999,
    gstCents: 818,
    bizPercent: 50,
    currency: 'AUD',
    schedule: RecurringSchedule.MONTHLY,
    dayOfMonth: 15,
    startDate: new Date('2025-07-01'),
    endDate: null,
    isActive: true,
    lastGeneratedDate: null,
    nextDueDate: new Date('2025-07-15'),
    providerId: 'provider-domestic-uuid',
    categoryId: 'category-uuid',
    provider: mockDomesticProvider as Provider,
    category: mockCategory as Category,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMockRepositories = (): Record<string, jest.Mock> => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringExpensesService,
        MoneyService,
        {
          provide: getRepositoryToken(RecurringExpense),
          useValue: createMockRepositories(),
        },
        {
          provide: getRepositoryToken(Expense),
          useValue: createMockRepositories(),
        },
        {
          provide: getRepositoryToken(Provider),
          useValue: createMockRepositories(),
        },
        {
          provide: getRepositoryToken(Category),
          useValue: createMockRepositories(),
        },
      ],
    }).compile();

    service = module.get<RecurringExpensesService>(RecurringExpensesService);
    recurringExpenseRepository = module.get(getRepositoryToken(RecurringExpense));
    expenseRepository = module.get(getRepositoryToken(Expense));
    providerRepository = module.get(getRepositoryToken(Provider));
    categoryRepository = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== CREATE TESTS ====================
  describe('create', () => {
    const createDto: CreateRecurringExpenseDto = {
      name: 'iinet Internet',
      description: 'Monthly internet service',
      amountCents: 8999,
      schedule: RecurringSchedule.MONTHLY,
      dayOfMonth: 15,
      startDate: '2025-07-01',
      bizPercent: 50,
      currency: 'AUD',
      isActive: true,
      providerId: 'provider-domestic-uuid',
      categoryId: 'category-uuid',
    };

    it('should create a recurring expense with domestic provider', async () => {
      providerRepository.findOne.mockResolvedValue(mockDomesticProvider as Provider);
      categoryRepository.count.mockResolvedValue(1);
      recurringExpenseRepository.create.mockReturnValue(mockRecurringExpense as RecurringExpense);
      recurringExpenseRepository.save.mockResolvedValue(mockRecurringExpense as RecurringExpense);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(recurringExpenseRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'iinet Internet',
          amountCents: 8999,
          gstCents: 818, // Auto-calculated: 8999 / 11 ≈ 818
          bizPercent: 50,
          schedule: RecurringSchedule.MONTHLY,
        }),
      );
    });

    it('should create a recurring expense with international provider (GST = 0)', async () => {
      providerRepository.findOne.mockResolvedValue(mockInternationalProvider as Provider);
      categoryRepository.count.mockResolvedValue(1);
      recurringExpenseRepository.create.mockReturnValue({
        ...mockRecurringExpense,
        gstCents: 0,
      } as RecurringExpense);
      recurringExpenseRepository.save.mockResolvedValue({
        ...mockRecurringExpense,
        gstCents: 0,
      } as RecurringExpense);

      const intlDto = { ...createDto, providerId: 'provider-intl-uuid' };
      await service.create(intlDto);

      expect(recurringExpenseRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          gstCents: 0,
        }),
      );
    });

    it('should throw NotFoundException if provider not found', async () => {
      providerRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Provider with ID "provider-domestic-uuid" not found',
      );
    });

    it('should throw NotFoundException if category not found', async () => {
      providerRepository.findOne.mockResolvedValue(mockDomesticProvider as Provider);
      categoryRepository.count.mockResolvedValue(0);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Category with ID "category-uuid" not found',
      );
    });

    it('should throw BadRequestException if GST exceeds amount', async () => {
      providerRepository.findOne.mockResolvedValue(mockDomesticProvider as Provider);
      categoryRepository.count.mockResolvedValue(1);

      const badDto = { ...createDto, gstCents: 10000 }; // GST > amount
      await expect(service.create(badDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(badDto)).rejects.toThrow('GST cannot exceed the total amount');
    });

    it('should throw BadRequestException if end date before start date', async () => {
      providerRepository.findOne.mockResolvedValue(mockDomesticProvider as Provider);
      categoryRepository.count.mockResolvedValue(1);

      const badDto = {
        ...createDto,
        startDate: '2025-07-01',
        endDate: '2025-06-01', // Before start
      };
      await expect(service.create(badDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(badDto)).rejects.toThrow('End date must be after start date');
    });

    it('should use provided GST for domestic provider', async () => {
      providerRepository.findOne.mockResolvedValue(mockDomesticProvider as Provider);
      categoryRepository.count.mockResolvedValue(1);
      recurringExpenseRepository.create.mockReturnValue(mockRecurringExpense as RecurringExpense);
      recurringExpenseRepository.save.mockResolvedValue(mockRecurringExpense as RecurringExpense);

      const dtoWithGst = { ...createDto, gstCents: 500 };
      await service.create(dtoWithGst);

      expect(recurringExpenseRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          gstCents: 500, // Use provided, not calculated
        }),
      );
    });

    it('should create with all required fields provided', async () => {
      providerRepository.findOne.mockResolvedValue(mockDomesticProvider as Provider);
      categoryRepository.count.mockResolvedValue(1);
      recurringExpenseRepository.create.mockReturnValue(mockRecurringExpense as RecurringExpense);
      recurringExpenseRepository.save.mockResolvedValue(mockRecurringExpense as RecurringExpense);

      const completeDto: CreateRecurringExpenseDto = {
        name: 'Test',
        amountCents: 1000,
        bizPercent: 100,
        currency: 'AUD',
        dayOfMonth: 1,
        isActive: true,
        schedule: RecurringSchedule.MONTHLY,
        startDate: '2025-07-01',
        providerId: 'provider-domestic-uuid',
        categoryId: 'category-uuid',
      };

      await service.create(completeDto);

      expect(recurringExpenseRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          bizPercent: 100,
          currency: 'AUD',
          dayOfMonth: 1,
          isActive: true,
        }),
      );
    });
  });

  // ==================== FIND ALL TESTS ====================
  describe('findAll', () => {
    it('should return all recurring expenses', async () => {
      recurringExpenseRepository.find.mockResolvedValue([mockRecurringExpense as RecurringExpense]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(recurringExpenseRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: ['provider', 'category'],
        order: { name: 'ASC' },
      });
    });

    it('should return only active recurring expenses when activeOnly=true', async () => {
      recurringExpenseRepository.find.mockResolvedValue([]);

      await service.findAll(true);

      expect(recurringExpenseRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['provider', 'category'],
        order: { name: 'ASC' },
      });
    });
  });

  // ==================== FIND ONE TESTS ====================
  describe('findOne', () => {
    it('should return a recurring expense by ID', async () => {
      recurringExpenseRepository.findOne.mockResolvedValue(
        mockRecurringExpense as RecurringExpense,
      );

      const result = await service.findOne('recurring-uuid');

      expect(result).toBeDefined();
      expect(result.id).toBe('recurring-uuid');
    });

    it('should throw NotFoundException if not found', async () => {
      recurringExpenseRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Recurring expense with ID "non-existent" not found',
      );
    });
  });

  // ==================== UPDATE TESTS ====================
  describe('update', () => {
    it('should update a recurring expense', async () => {
      recurringExpenseRepository.findOne.mockResolvedValue(
        mockRecurringExpense as RecurringExpense,
      );
      recurringExpenseRepository.save.mockResolvedValue({
        ...mockRecurringExpense,
        name: 'Updated Name',
      } as RecurringExpense);

      const result = await service.update('recurring-uuid', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should recalculate GST when changing to international provider', async () => {
      const existingMock = {
        ...mockRecurringExpense,
        gstCents: 818,
      } as RecurringExpense;

      recurringExpenseRepository.findOne.mockResolvedValue(existingMock);
      providerRepository.findOne.mockResolvedValue(mockInternationalProvider as Provider);
      recurringExpenseRepository.save.mockImplementation(
        async (entity) => entity as RecurringExpense,
      );

      await service.update('recurring-uuid', {
        providerId: 'provider-intl-uuid',
      });

      expect(recurringExpenseRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          gstCents: 0, // Should be set to 0 for international
        }),
      );
    });

    it('should throw NotFoundException when changing to non-existent provider', async () => {
      recurringExpenseRepository.findOne.mockResolvedValue(
        mockRecurringExpense as RecurringExpense,
      );
      providerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('recurring-uuid', { providerId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when changing to non-existent category', async () => {
      recurringExpenseRepository.findOne.mockResolvedValue(
        mockRecurringExpense as RecurringExpense,
      );
      categoryRepository.count.mockResolvedValue(0);

      await expect(
        service.update('recurring-uuid', { categoryId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should recalculate nextDueDate when schedule changes', async () => {
      recurringExpenseRepository.findOne.mockResolvedValue(
        mockRecurringExpense as RecurringExpense,
      );
      recurringExpenseRepository.save.mockImplementation(
        async (entity) => entity as RecurringExpense,
      );

      await service.update('recurring-uuid', {
        schedule: RecurringSchedule.QUARTERLY,
      });

      expect(recurringExpenseRepository.save).toHaveBeenCalled();
    });
  });

  // ==================== REMOVE TESTS ====================
  describe('remove', () => {
    it('should delete a recurring expense', async () => {
      recurringExpenseRepository.findOne.mockResolvedValue(
        mockRecurringExpense as RecurringExpense,
      );
      recurringExpenseRepository.remove.mockResolvedValue(mockRecurringExpense as RecurringExpense);

      await service.remove('recurring-uuid');

      expect(recurringExpenseRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      recurringExpenseRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== CALCULATE NEXT DUE DATE TESTS ====================
  describe('calculateNextDueDate', () => {
    it('should return first occurrence when never generated', () => {
      const startDate = new Date('2025-07-01');
      const result = service.calculateNextDueDate(startDate, RecurringSchedule.MONTHLY, 15, null);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(6); // July (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    it('should move to next period if dayOfMonth already passed in start month', () => {
      const startDate = new Date('2025-07-20'); // Past 15th
      const result = service.calculateNextDueDate(startDate, RecurringSchedule.MONTHLY, 15, null);

      expect(result.getMonth()).toBe(7); // August
      expect(result.getDate()).toBe(15);
    });

    it('should add one month for monthly schedule', () => {
      const lastGenerated = new Date('2025-07-15');
      const result = service.calculateNextDueDate(
        new Date('2025-07-01'),
        RecurringSchedule.MONTHLY,
        15,
        lastGenerated,
      );

      expect(result.getMonth()).toBe(7); // August
      expect(result.getDate()).toBe(15);
    });

    it('should add three months for quarterly schedule', () => {
      const lastGenerated = new Date('2025-07-15');
      const result = service.calculateNextDueDate(
        new Date('2025-07-01'),
        RecurringSchedule.QUARTERLY,
        15,
        lastGenerated,
      );

      expect(result.getMonth()).toBe(9); // October
      expect(result.getDate()).toBe(15);
    });

    it('should add one year for yearly schedule', () => {
      const lastGenerated = new Date('2025-07-15');
      const result = service.calculateNextDueDate(
        new Date('2025-07-01'),
        RecurringSchedule.YEARLY,
        15,
        lastGenerated,
      );

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(6); // July
      expect(result.getDate()).toBe(15);
    });
  });

  // ==================== GENERATE EXPENSES TESTS ====================
  describe('generateExpenses', () => {
    it('should generate expenses for due recurring templates', async () => {
      const dueRecurring = {
        ...mockRecurringExpense,
        nextDueDate: new Date('2025-07-15'),
      } as RecurringExpense;

      recurringExpenseRepository.find.mockResolvedValue([dueRecurring]);
      expenseRepository.create.mockReturnValue({ id: 'expense-uuid' } as Expense);
      expenseRepository.save.mockResolvedValue({
        id: 'expense-uuid',
        amountCents: 8999,
      } as Expense);
      recurringExpenseRepository.save.mockResolvedValue(dueRecurring);

      const result = await service.generateExpenses(new Date('2025-07-20'));

      expect(result.generated).toBe(1);
      expect(result.expenseIds).toContain('expense-uuid');
      expect(expenseRepository.save).toHaveBeenCalled();
    });

    it('should skip if past end date', async () => {
      const pastEndRecurring = {
        ...mockRecurringExpense,
        nextDueDate: new Date('2025-08-15'),
        endDate: new Date('2025-07-31'), // Ended before next due
      } as RecurringExpense;

      recurringExpenseRepository.find.mockResolvedValue([pastEndRecurring]);

      const result = await service.generateExpenses(new Date('2025-08-20'));

      expect(result.generated).toBe(0);
      expect(result.skipped).toBe(1);
      expect(expenseRepository.save).not.toHaveBeenCalled();
    });

    it('should update lastGeneratedDate and nextDueDate after generation', async () => {
      const dueRecurring = {
        ...mockRecurringExpense,
        nextDueDate: new Date('2025-07-15'),
        lastGeneratedDate: null,
      } as RecurringExpense;

      recurringExpenseRepository.find.mockResolvedValue([dueRecurring]);
      expenseRepository.create.mockReturnValue({ id: 'expense-uuid' } as Expense);
      expenseRepository.save.mockResolvedValue({
        id: 'expense-uuid',
        amountCents: 8999,
      } as Expense);
      recurringExpenseRepository.save.mockImplementation(
        async (entity) => entity as RecurringExpense,
      );

      await service.generateExpenses(new Date('2025-07-20'));

      expect(recurringExpenseRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          lastGeneratedDate: expect.any(Date),
          nextDueDate: expect.any(Date),
        }),
      );
    });

    it('should return empty result if no due templates', async () => {
      recurringExpenseRepository.find.mockResolvedValue([]);

      const result = await service.generateExpenses();

      expect(result.generated).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.expenseIds).toEqual([]);
    });

    it('should use expense description from template', async () => {
      const dueRecurring = {
        ...mockRecurringExpense,
        description: 'Custom description',
        nextDueDate: new Date('2025-07-15'),
      } as RecurringExpense;

      recurringExpenseRepository.find.mockResolvedValue([dueRecurring]);
      expenseRepository.create.mockReturnValue({ id: 'expense-uuid' } as Expense);
      expenseRepository.save.mockResolvedValue({
        id: 'expense-uuid',
        amountCents: 8999,
      } as Expense);
      recurringExpenseRepository.save.mockResolvedValue(dueRecurring);

      await service.generateExpenses(new Date('2025-07-20'));

      expect(expenseRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Custom description',
        }),
      );
    });

    it('should use auto-generated description if template has none', async () => {
      const dueRecurring = {
        ...mockRecurringExpense,
        description: null,
        name: 'iinet Internet',
        nextDueDate: new Date('2025-07-15'),
      } as RecurringExpense;

      recurringExpenseRepository.find.mockResolvedValue([dueRecurring]);
      expenseRepository.create.mockReturnValue({ id: 'expense-uuid' } as Expense);
      expenseRepository.save.mockResolvedValue({
        id: 'expense-uuid',
        amountCents: 8999,
      } as Expense);
      recurringExpenseRepository.save.mockResolvedValue(dueRecurring);

      await service.generateExpenses(new Date('2025-07-20'));

      expect(expenseRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'iinet Internet - Auto-generated',
        }),
      );
    });
  });

  // ==================== FIND DUE TESTS ====================
  describe('findDue', () => {
    it('should return recurring expenses due for generation', async () => {
      recurringExpenseRepository.find.mockResolvedValue([mockRecurringExpense as RecurringExpense]);

      const result = await service.findDue(new Date('2025-07-20'));

      expect(result).toHaveLength(1);
      expect(recurringExpenseRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }),
      );
    });
  });

  // ==================== FIND ALL ACTIVE TESTS ====================
  describe('findAllActive', () => {
    it('should return all active recurring expenses sorted by nextDueDate', async () => {
      const mockExpense1 = {
        ...mockRecurringExpense,
        id: 'id-1',
        nextDueDate: new Date('2025-08-01'),
      };
      const mockExpense2 = {
        ...mockRecurringExpense,
        id: 'id-2',
        nextDueDate: new Date('2025-07-15'),
      };

      recurringExpenseRepository.find.mockResolvedValue([
        mockExpense1 as RecurringExpense,
        mockExpense2 as RecurringExpense,
      ]);

      const result = await service.findAllActive();

      expect(result).toHaveLength(2);
      expect(recurringExpenseRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['provider', 'category'],
        order: { nextDueDate: 'ASC' },
      });
    });

    it('should return empty array if no active recurring expenses', async () => {
      recurringExpenseRepository.find.mockResolvedValue([]);

      const result = await service.findAllActive();

      expect(result).toHaveLength(0);
    });
  });

  // ==================== TO RESPONSE DTO TESTS ====================
  describe('toResponseDto', () => {
    it('should convert entity to response DTO', () => {
      const entity = mockRecurringExpense as RecurringExpense;
      const result = service.toResponseDto(entity);

      expect(result.id).toBe(entity.id);
      expect(result.name).toBe(entity.name);
      expect(result.amountCents).toBe(entity.amountCents);
      expect(result.schedule).toBe(entity.schedule);
      expect(result.providerName).toBe('iinet');
      expect(result.categoryName).toBe('Internet');
      expect(result.startDate).toBe('2025-07-01');
    });

    it('should handle null optional fields', () => {
      const entity = {
        ...mockRecurringExpense,
        endDate: null,
        lastGeneratedDate: null,
        description: null,
      } as RecurringExpense;

      const result = service.toResponseDto(entity);

      expect(result.endDate).toBeNull();
      expect(result.lastGeneratedDate).toBeNull();
      expect(result.description).toBeNull();
    });
  });
});
