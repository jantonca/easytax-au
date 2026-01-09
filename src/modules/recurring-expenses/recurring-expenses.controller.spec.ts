import { Test, TestingModule } from '@nestjs/testing';
import { RecurringExpensesController } from './recurring-expenses.controller';
import { RecurringExpensesService } from './recurring-expenses.service';
import { RecurringExpense, RecurringSchedule } from './entities/recurring-expense.entity';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { RecurringExpenseResponseDto } from './dto/recurring-expense-response.dto';

describe('RecurringExpensesController', () => {
  let controller: RecurringExpensesController;
  let service: jest.Mocked<RecurringExpensesService>;

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
    providerId: 'provider-uuid',
    categoryId: 'category-uuid',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockResponseDto: RecurringExpenseResponseDto = {
    id: 'recurring-uuid',
    name: 'iinet Internet',
    description: 'Monthly internet service',
    amountCents: 8999,
    gstCents: 818,
    bizPercent: 50,
    currency: 'AUD',
    schedule: RecurringSchedule.MONTHLY,
    dayOfMonth: 15,
    startDate: '2025-07-01',
    endDate: null,
    isActive: true,
    lastGeneratedDate: null,
    nextDueDate: '2025-07-15',
    providerId: 'provider-uuid',
    providerName: 'iinet',
    categoryId: 'category-uuid',
    categoryName: 'Internet',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      generateExpenses: jest.fn(),
      findDue: jest.fn(),
      findAllActive: jest.fn(),
      toResponseDto: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringExpensesController],
      providers: [
        {
          provide: RecurringExpensesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<RecurringExpensesController>(RecurringExpensesController);
    service = module.get(RecurringExpensesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ==================== CREATE TESTS ====================
  describe('create', () => {
    it('should create a recurring expense and return response DTO', async () => {
      const createDto: CreateRecurringExpenseDto = {
        name: 'iinet Internet',
        amountCents: 8999,
        schedule: RecurringSchedule.MONTHLY,
        startDate: '2025-07-01',
        providerId: 'provider-uuid',
        categoryId: 'category-uuid',
      };

      service.create.mockResolvedValue(mockRecurringExpense as RecurringExpense);
      service.findOne.mockResolvedValue(mockRecurringExpense as RecurringExpense);
      service.toResponseDto.mockReturnValue(mockResponseDto);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockResponseDto);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  // ==================== FIND ALL TESTS ====================
  describe('findAll', () => {
    it('should return all recurring expenses', async () => {
      service.findAll.mockResolvedValue([mockRecurringExpense as RecurringExpense]);
      service.toResponseDto.mockReturnValue(mockResponseDto);

      const result = await controller.findAll();

      expect(result).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith(false);
    });

    it('should filter to active only when specified', async () => {
      service.findAll.mockResolvedValue([]);

      await controller.findAll('true');

      expect(service.findAll).toHaveBeenCalledWith(true);
    });
  });

  // ==================== FIND DUE TESTS ====================
  describe('findDue', () => {
    it('should return due recurring expenses', async () => {
      service.findDue.mockResolvedValue([mockRecurringExpense as RecurringExpense]);
      service.toResponseDto.mockReturnValue(mockResponseDto);

      const result = await controller.findDue();

      expect(result).toHaveLength(1);
      expect(service.findDue).toHaveBeenCalledWith(undefined);
    });

    it('should accept asOfDate parameter', async () => {
      service.findDue.mockResolvedValue([]);

      await controller.findDue('2025-07-20');

      expect(service.findDue).toHaveBeenCalledWith(new Date('2025-07-20'));
    });
  });

  // ==================== FIND ALL ACTIVE TESTS ====================
  describe('findAllActive', () => {
    it('should return all active recurring expenses', async () => {
      service.findAllActive.mockResolvedValue([mockRecurringExpense as RecurringExpense]);
      service.toResponseDto.mockReturnValue(mockResponseDto);

      const result = await controller.findAllActive();

      expect(result).toHaveLength(1);
      expect(service.findAllActive).toHaveBeenCalled();
      expect(service.toResponseDto).toHaveBeenCalledWith(mockRecurringExpense);
    });

    it('should return empty array if no active recurring expenses', async () => {
      service.findAllActive.mockResolvedValue([]);

      const result = await controller.findAllActive();

      expect(result).toHaveLength(0);
    });
  });

  // ==================== GENERATE TESTS ====================
  describe('generate', () => {
    it('should generate expenses from due templates', async () => {
      const generateResult = {
        generated: 2,
        skipped: 0,
        expenseIds: ['exp-1', 'exp-2'],
        details: [],
      };
      service.generateExpenses.mockResolvedValue(generateResult);

      const result = await controller.generate();

      expect(result).toEqual(generateResult);
      expect(service.generateExpenses).toHaveBeenCalledWith(undefined);
    });

    it('should accept asOfDate parameter', async () => {
      service.generateExpenses.mockResolvedValue({
        generated: 0,
        skipped: 0,
        expenseIds: [],
        details: [],
      });

      await controller.generate('2025-07-20');

      expect(service.generateExpenses).toHaveBeenCalledWith(new Date('2025-07-20'));
    });
  });

  // ==================== FIND ONE TESTS ====================
  describe('findOne', () => {
    it('should return a recurring expense by ID', async () => {
      service.findOne.mockResolvedValue(mockRecurringExpense as RecurringExpense);
      service.toResponseDto.mockReturnValue(mockResponseDto);

      const result = await controller.findOne('recurring-uuid');

      expect(result).toEqual(mockResponseDto);
      expect(service.findOne).toHaveBeenCalledWith('recurring-uuid');
    });
  });

  // ==================== UPDATE TESTS ====================
  describe('update', () => {
    it('should update a recurring expense', async () => {
      const updateDto = { name: 'Updated Name' };
      service.update.mockResolvedValue({
        ...mockRecurringExpense,
        name: 'Updated Name',
      } as RecurringExpense);
      service.findOne.mockResolvedValue({
        ...mockRecurringExpense,
        name: 'Updated Name',
      } as RecurringExpense);
      service.toResponseDto.mockReturnValue({
        ...mockResponseDto,
        name: 'Updated Name',
      });

      const result = await controller.update('recurring-uuid', updateDto);

      expect(result.name).toBe('Updated Name');
      expect(service.update).toHaveBeenCalledWith('recurring-uuid', updateDto);
    });
  });

  // ==================== REMOVE TESTS ====================
  describe('remove', () => {
    it('should delete a recurring expense', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('recurring-uuid');

      expect(service.remove).toHaveBeenCalledWith('recurring-uuid');
    });
  });
});
