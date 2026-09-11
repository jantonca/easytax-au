import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { Income } from './entities/income.entity';
import { Client } from '../clients/entities/client.entity';
import { MoneyService } from '../../common/services/money.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';

describe('IncomesService', () => {
  let service: IncomesService;

  // Mock data
  const mockClient: Client = {
    id: '111e4567-e89b-12d3-a456-426614174000',
    name: 'Acme Corp',
    abn: '51824753556',
    isPsiEligible: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockIncome: Income = {
    id: '222e4567-e89b-12d3-a456-426614174000',
    date: new Date('2024-01-15'),
    invoiceNum: 'INV-2024-001',
    description: 'Website development',
    subtotalCents: 100000,
    gstCents: 10000,
    totalCents: 110000,
    isPaid: false,
    clientId: mockClient.id,
    client: mockClient,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockIncomeRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const mockClientRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomesService,
        MoneyService,
        {
          provide: getRepositoryToken(Income),
          useValue: mockIncomeRepository,
        },
        {
          provide: getRepositoryToken(Client),
          useValue: mockClientRepository,
        },
      ],
    }).compile();

    service = module.get<IncomesService>(IncomesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create income with auto-calculated total', async () => {
      const createDto: CreateIncomeDto = {
        date: '2024-01-15',
        clientId: mockClient.id,
        subtotalCents: 100000,
        gstCents: 10000,
        invoiceNum: 'INV-2024-001',
        description: 'Website development',
      };

      mockClientRepository.count.mockResolvedValue(1);
      mockIncomeRepository.create.mockReturnValue(mockIncome);
      mockIncomeRepository.save.mockResolvedValue(mockIncome);
      mockIncomeRepository.findOne.mockResolvedValue(mockIncome);

      const result = await service.create(createDto);

      expect(mockIncomeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotalCents: 100000,
          gstCents: 10000,
          totalCents: 110000, // Auto-calculated: 100000 + 10000
          isPaid: false,
        }),
      );
      expect(result).toEqual(mockIncome);
    });

    it('should create income with isPaid = true', async () => {
      const createDto: CreateIncomeDto = {
        date: '2024-01-15',
        clientId: mockClient.id,
        subtotalCents: 50000,
        gstCents: 5000,
        isPaid: true,
        paymentDate: '2024-01-20',
      };

      const paidIncome = {
        ...mockIncome,
        isPaid: true,
        subtotalCents: 50000,
        gstCents: 5000,
        totalCents: 55000,
      };

      mockClientRepository.count.mockResolvedValue(1);
      mockIncomeRepository.create.mockReturnValue(paidIncome);
      mockIncomeRepository.save.mockResolvedValue(paidIncome);
      mockIncomeRepository.findOne.mockResolvedValue(paidIncome);

      const result = await service.create(createDto);

      expect(mockIncomeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isPaid: true,
          totalCents: 55000,
        }),
      );
      expect(result.isPaid).toBe(true);
    });

    it('should create income with zero GST (non-taxable)', async () => {
      const createDto: CreateIncomeDto = {
        date: '2024-01-15',
        clientId: mockClient.id,
        subtotalCents: 100000,
        gstCents: 0,
      };

      const noGstIncome = { ...mockIncome, gstCents: 0, totalCents: 100000 };

      mockClientRepository.count.mockResolvedValue(1);
      mockIncomeRepository.create.mockReturnValue(noGstIncome);
      mockIncomeRepository.save.mockResolvedValue(noGstIncome);
      mockIncomeRepository.findOne.mockResolvedValue(noGstIncome);

      const result = await service.create(createDto);

      expect(mockIncomeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          gstCents: 0,
          totalCents: 100000, // Same as subtotal when GST = 0
        }),
      );
      expect(result.totalCents).toBe(100000);
    });

    it('should throw NotFoundException if client not found', async () => {
      const createDto: CreateIncomeDto = {
        date: '2024-01-15',
        clientId: 'non-existent-id',
        subtotalCents: 100000,
        gstCents: 10000,
      };

      mockClientRepository.count.mockResolvedValue(0);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all incomes ordered by date descending', async () => {
      const incomes = [mockIncome, { ...mockIncome, id: '333' }];
      mockIncomeRepository.find.mockResolvedValue(incomes);

      const result = await service.findAll();

      expect(mockIncomeRepository.find).toHaveBeenCalledWith({
        relations: ['client'],
        order: { date: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return an income by ID', async () => {
      mockIncomeRepository.findOne.mockResolvedValue(mockIncome);

      const result = await service.findOne(mockIncome.id);

      expect(mockIncomeRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockIncome.id },
        relations: ['client'],
      });
      expect(result).toEqual(mockIncome);
    });

    it('should throw NotFoundException if income not found', async () => {
      mockIncomeRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByDateRange', () => {
    it('should return incomes within date range', async () => {
      const incomes = [mockIncome];
      mockIncomeRepository.find.mockResolvedValue(incomes);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-31');

      const result = await service.findByDateRange(startDate, endDate);

      expect(mockIncomeRepository.find).toHaveBeenCalledWith({
        where: {
          date: expect.anything(), // Between operator
        },
        relations: ['client'],
        order: { date: 'DESC' },
      });
      expect(result).toEqual(incomes);
    });
  });

  describe('findByClient', () => {
    it('should return incomes by client', async () => {
      const incomes = [mockIncome];
      mockIncomeRepository.find.mockResolvedValue(incomes);

      const result = await service.findByClient(mockClient.id);

      expect(mockIncomeRepository.find).toHaveBeenCalledWith({
        where: { clientId: mockClient.id },
        relations: ['client'],
        order: { date: 'DESC' },
      });
      expect(result).toEqual(incomes);
    });
  });

  describe('findByPaymentStatus', () => {
    it('should return paid incomes', async () => {
      const paidIncomes = [{ ...mockIncome, isPaid: true }];
      mockIncomeRepository.find.mockResolvedValue(paidIncomes);

      const result = await service.findByPaymentStatus(true);

      expect(mockIncomeRepository.find).toHaveBeenCalledWith({
        where: { isPaid: true },
        relations: ['client'],
        order: { date: 'DESC' },
      });
      expect(result).toEqual(paidIncomes);
    });

    it('should return unpaid incomes', async () => {
      const unpaidIncomes = [mockIncome];
      mockIncomeRepository.find.mockResolvedValue(unpaidIncomes);

      const result = await service.findByPaymentStatus(false);

      expect(mockIncomeRepository.find).toHaveBeenCalledWith({
        where: { isPaid: false },
        relations: ['client'],
        order: { date: 'DESC' },
      });
      expect(result).toEqual(unpaidIncomes);
    });
  });

  describe('update', () => {
    it('should update income fields', async () => {
      const updateDto: UpdateIncomeDto = {
        subtotalCents: 120000,
        description: 'Updated description',
      };
      const updatedIncome = {
        ...mockIncome,
        subtotalCents: 120000,
        gstCents: 10000,
        totalCents: 130000, // Recalculated
        description: 'Updated description',
      };

      mockIncomeRepository.findOne
        .mockResolvedValueOnce({ ...mockIncome })
        .mockResolvedValueOnce(updatedIncome);
      mockIncomeRepository.save.mockResolvedValue(updatedIncome);

      const result = await service.update(mockIncome.id, updateDto);

      expect(result.subtotalCents).toBe(120000);
      expect(result.totalCents).toBe(130000);
    });

    it('should recalculate total when GST changes', async () => {
      const updateDto: UpdateIncomeDto = {
        gstCents: 15000,
      };
      const updatedIncome = {
        ...mockIncome,
        gstCents: 15000,
        totalCents: 115000, // Recalculated: 100000 + 15000
      };

      mockIncomeRepository.findOne
        .mockResolvedValueOnce({ ...mockIncome })
        .mockResolvedValueOnce(updatedIncome);
      mockIncomeRepository.save.mockResolvedValue(updatedIncome);

      const result = await service.update(mockIncome.id, updateDto);

      expect(result.gstCents).toBe(15000);
      expect(result.totalCents).toBe(115000);
    });

    it('should update client when clientId changes', async () => {
      const newClient = { ...mockClient, id: '999e4567-e89b-12d3-a456-426614174000' };
      const updateDto: UpdateIncomeDto = {
        clientId: newClient.id,
      };
      const updatedIncome = {
        ...mockIncome,
        clientId: newClient.id,
        client: newClient,
      };

      mockIncomeRepository.findOne
        .mockResolvedValueOnce({ ...mockIncome })
        .mockResolvedValueOnce(updatedIncome);
      mockClientRepository.count.mockResolvedValue(1);
      mockIncomeRepository.save.mockResolvedValue(updatedIncome);

      const result = await service.update(mockIncome.id, updateDto);

      expect(result.clientId).toBe(newClient.id);
    });

    it('should throw NotFoundException if client not found on update', async () => {
      const updateDto: UpdateIncomeDto = {
        clientId: 'non-existent-id',
      };

      mockIncomeRepository.findOne.mockResolvedValue({ ...mockIncome });
      mockClientRepository.count.mockResolvedValue(0);

      await expect(service.update(mockIncome.id, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if income not found', async () => {
      const updateDto: UpdateIncomeDto = { subtotalCents: 50000 };

      mockIncomeRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an income', async () => {
      mockIncomeRepository.findOne.mockResolvedValue(mockIncome);
      mockIncomeRepository.remove.mockResolvedValue(mockIncome);

      await service.remove(mockIncome.id);

      expect(mockIncomeRepository.remove).toHaveBeenCalledWith(mockIncome);
    });

    it('should throw NotFoundException if income not found', async () => {
      mockIncomeRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exists', () => {
    it('should return true if income exists', async () => {
      mockIncomeRepository.count.mockResolvedValue(1);

      const result = await service.exists(mockIncome.id);

      expect(result).toBe(true);
    });

    it('should return false if income does not exist', async () => {
      mockIncomeRepository.count.mockResolvedValue(0);

      const result = await service.exists('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('markAsPaid', () => {
    it('should mark income as paid', async () => {
      const paidIncome = { ...mockIncome, isPaid: true };

      mockIncomeRepository.findOne
        .mockResolvedValueOnce({ ...mockIncome })
        .mockResolvedValueOnce(paidIncome);
      mockIncomeRepository.save.mockResolvedValue(paidIncome);

      const result = await service.markAsPaid(mockIncome.id, '2024-02-01');

      expect(result.isPaid).toBe(true);
    });
  });

  describe('markAsUnpaid', () => {
    it('should mark income as unpaid', async () => {
      const paidIncome = { ...mockIncome, isPaid: true, paymentDate: new Date('2024-02-01') };
      const unpaidIncome = { ...mockIncome, isPaid: false, paymentDate: null };

      mockIncomeRepository.findOne
        .mockResolvedValueOnce(paidIncome)
        .mockResolvedValueOnce(unpaidIncome);
      mockIncomeRepository.save.mockResolvedValue(unpaidIncome);

      const result = await service.markAsUnpaid(mockIncome.id);

      expect(result.isPaid).toBe(false);
    });
  });

  describe('payment-date semantics (M02)', () => {
    describe('create', () => {
      it('rejects isPaid=true without a payment date', async () => {
        mockClientRepository.count.mockResolvedValue(1);

        await expect(
          service.create({
            date: '2026-06-30',
            clientId: mockClient.id,
            subtotalCents: 100000,
            gstCents: 10000,
            isPaid: true,
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('stores the payment date when creating a paid income', async () => {
        mockClientRepository.count.mockResolvedValue(1);
        mockIncomeRepository.create.mockImplementation((x) => {
          return Promise.resolve(x);
        });
        mockIncomeRepository.save.mockResolvedValue({});
        mockIncomeRepository.findOne.mockResolvedValue({ ...mockIncome, isPaid: true });

        await service.create({
          date: '2026-06-30',
          clientId: mockClient.id,
          subtotalCents: 100000,
          gstCents: 10000,
          isPaid: true,
          paymentDate: '2026-07-02',
        });

        expect(mockIncomeRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            isPaid: true,
            paymentDate: new Date('2026-07-02'),
          }),
        );
      });

      it('rejects a future payment date', async () => {
        await expect(
          service.create({
            date: '2026-06-30',
            clientId: mockClient.id,
            subtotalCents: 100000,
            gstCents: 10000,
            isPaid: true,
            paymentDate: '9999-01-01',
          }),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('update transitions', () => {
      it('rejects isPaid=true with no payment date when income is currently unpaid', async () => {
        mockIncomeRepository.findOne.mockResolvedValue({ ...mockIncome, isPaid: false });

        await expect(service.update(mockIncome.id, { isPaid: true })).rejects.toThrow(
          BadRequestException,
        );
      });

      it('allows isPaid=true without payment date when income is already paid (keeps unknown state)', async () => {
        mockIncomeRepository.findOne.mockResolvedValue({
          ...mockIncome,
          isPaid: true,
          paymentDate: null,
        });

        const result = await service.update(mockIncome.id, { isPaid: true });

        expect(result.isPaid).toBe(true);
      });

      it('sets a payment date on a paid income (reconciliation)', async () => {
        const unpaid = { ...mockIncome, isPaid: false };
        mockIncomeRepository.findOne
          .mockResolvedValueOnce({ ...mockIncome, isPaid: true, paymentDate: null })
          .mockResolvedValueOnce({ ...mockIncome, isPaid: true });

        await service.update(mockIncome.id, { paymentDate: '2026-07-02' });

        expect(mockIncomeRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            isPaid: true,
            paymentDate: new Date('2026-07-02'),
          }),
        );
        void unpaid;
      });

      it('rejects a payment date on an unpaid income (contradictory)', async () => {
        mockIncomeRepository.findOne.mockResolvedValue({ ...mockIncome, isPaid: false });

        await expect(service.update(mockIncome.id, { paymentDate: '2026-07-02' })).rejects.toThrow(
          BadRequestException,
        );
      });

      it('rejects isPaid=false with a payment date (contradictory)', async () => {
        mockIncomeRepository.findOne.mockResolvedValue({ ...mockIncome, isPaid: true });

        await expect(
          service.update(mockIncome.id, { isPaid: false, paymentDate: '2026-07-02' }),
        ).rejects.toThrow(BadRequestException);
      });

      it('rejects newly marking an unpaid income paid with paymentDate null (R04)', async () => {
        mockIncomeRepository.findOne.mockResolvedValue({ ...mockIncome, isPaid: false });

        await expect(
          service.update(mockIncome.id, { isPaid: true, paymentDate: null }),
        ).rejects.toThrow(BadRequestException);
      });

      it('rejects a paymentDate on an unpaid create payload (R04)', async () => {
        mockClientRepository.count.mockResolvedValue(1);

        await expect(
          service.create({
            date: '2026-06-30',
            clientId: mockClient.id,
            subtotalCents: 100000,
            gstCents: 10000,
            isPaid: false,
            paymentDate: '2026-07-02',
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('allows paymentDate null on an already-paid income (deliberate re-unknown)', async () => {
        const alreadyPaid = { ...mockIncome, isPaid: true, paymentDate: new Date('2026-07-02') };
        mockIncomeRepository.findOne
          .mockResolvedValueOnce(alreadyPaid)
          .mockResolvedValueOnce({ ...mockIncome, isPaid: true, paymentDate: null });

        const result = await service.update(mockIncome.id, { isPaid: true, paymentDate: null });

        expect(mockIncomeRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({ isPaid: true, paymentDate: null }),
        );
        expect(result.isPaid).toBe(true);
      });

      it('clears the payment date when marking unpaid', async () => {
        const paid = { ...mockIncome, isPaid: true, paymentDate: new Date('2026-07-02') };
        const cleared = { ...mockIncome, isPaid: false, paymentDate: null };

        mockIncomeRepository.findOne.mockResolvedValueOnce(paid).mockResolvedValueOnce(cleared);

        await service.markAsUnpaid(mockIncome.id);

        expect(mockIncomeRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({ isPaid: false, paymentDate: null }),
        );
      });
    });

    describe('markAsPaid requires a receipt date', () => {
      it('throws BadRequestException when payment date is missing', async () => {
        await expect(service.markAsPaid(mockIncome.id)).rejects.toThrow(BadRequestException);
      });

      it('rejects invalid date strings', async () => {
        await expect(service.markAsPaid(mockIncome.id, 'not-a-date')).rejects.toThrow(
          BadRequestException,
        );
      });

      it('marks paid with the supplied receipt date', async () => {
        mockIncomeRepository.findOne
          .mockResolvedValueOnce({ ...mockIncome, isPaid: false })
          .mockResolvedValueOnce({ ...mockIncome, isPaid: true });
        mockIncomeRepository.save.mockImplementation((x) => Promise.resolve(x));

        const result = await service.markAsPaid(mockIncome.id, '2026-07-02');

        expect(mockIncomeRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            isPaid: true,
            paymentDate: new Date('2026-07-02'),
          }),
        );
        expect(result.isPaid).toBe(true);
      });

      it('accepts a receipt date that is today in Sydney but tomorrow in UTC (R07)', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-06-30T15:00:00.000Z'));

        try {
          mockIncomeRepository.findOne
            .mockResolvedValueOnce({ ...mockIncome, isPaid: false })
            .mockResolvedValueOnce({ ...mockIncome, isPaid: true });
          mockIncomeRepository.save.mockImplementation((x) => Promise.resolve(x));

          // 2026-06-30T15:00Z = 2026-07-01 01:00 Sydney: a July 1 receipt is
          // today for the business, not the future.
          await expect(service.markAsPaid(mockIncome.id, '2026-07-01')).resolves.toBeDefined();
        } finally {
          jest.useRealTimers();
        }
      });

      it('rejects a date after the Australian business day (R07)', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-06-30T15:00:00.000Z'));

        try {
          await expect(service.markAsPaid(mockIncome.id, '2026-07-02')).rejects.toThrow(/future/);
        } finally {
          jest.useRealTimers();
        }
      });

      it('rejects impossible calendar dates (R05)', async () => {
        await expect(service.markAsPaid(mockIncome.id, '2026-06-31')).rejects.toThrow(
          BadRequestException,
        );
      });
    });
  });
});
