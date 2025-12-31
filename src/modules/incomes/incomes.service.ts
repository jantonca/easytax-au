import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Income } from './entities/income.entity';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { Client } from '../clients/entities/client.entity';
import { MoneyService } from '../../common/services/money.service';

/**
 * Service for managing Income entities.
 *
 * Handles CRUD operations with automatic total calculation:
 * - `totalCents` is always calculated as `subtotalCents + gstCents`
 *
 * All monetary calculations use decimal.js via MoneyService to avoid floating-point errors.
 */
@Injectable()
export class IncomesService {
  constructor(
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly moneyService: MoneyService,
  ) {}

  /**
   * Creates a new income record with automatic total calculation.
   *
   * Total is calculated as: `totalCents = subtotalCents + gstCents`
   *
   * @param createIncomeDto - The income data
   * @returns The created income with client relation
   * @throws NotFoundException if client not found
   */
  async create(createIncomeDto: CreateIncomeDto): Promise<Income> {
    // Validate client exists
    const clientExists = await this.clientRepository.count({
      where: { id: createIncomeDto.clientId },
    });
    if (clientExists === 0) {
      throw new NotFoundException(`Client with ID "${createIncomeDto.clientId}" not found`);
    }

    // Calculate total (subtotal + GST)
    const totalCents = this.moneyService.addAmounts(
      createIncomeDto.subtotalCents,
      createIncomeDto.gstCents,
    );

    const income = this.incomeRepository.create({
      date: new Date(createIncomeDto.date),
      clientId: createIncomeDto.clientId,
      invoiceNum: createIncomeDto.invoiceNum ?? null,
      description: createIncomeDto.description ?? null,
      subtotalCents: createIncomeDto.subtotalCents,
      gstCents: createIncomeDto.gstCents,
      totalCents,
      isPaid: createIncomeDto.isPaid ?? false,
    });

    const saved = await this.incomeRepository.save(income);

    // Return with relations loaded
    return this.findOne(saved.id);
  }

  /**
   * Retrieves all income records with relations.
   *
   * @returns Array of all incomes, ordered by date descending
   */
  async findAll(): Promise<Income[]> {
    return this.incomeRepository.find({
      relations: ['client'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Retrieves a single income by ID.
   *
   * @param id - The income UUID
   * @returns The income with client relation
   * @throws NotFoundException if income doesn't exist
   */
  async findOne(id: string): Promise<Income> {
    const income = await this.incomeRepository.findOne({
      where: { id },
      relations: ['client'],
    });

    if (!income) {
      throw new NotFoundException(`Income with ID "${id}" not found`);
    }

    return income;
  }

  /**
   * Finds incomes within a date range.
   *
   * @param startDate - Start of date range (inclusive)
   * @param endDate - End of date range (inclusive)
   * @returns Array of incomes within the range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Income[]> {
    return this.incomeRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      relations: ['client'],
      order: { date: 'DESC' },
    });
  }

  /**
   * Finds incomes by client.
   *
   * @param clientId - The client UUID
   * @returns Array of incomes from the client
   */
  async findByClient(clientId: string): Promise<Income[]> {
    return this.incomeRepository.find({
      where: { clientId },
      relations: ['client'],
      order: { date: 'DESC' },
    });
  }

  /**
   * Finds incomes by payment status.
   *
   * @param isPaid - Whether to find paid or unpaid incomes
   * @returns Array of incomes matching the payment status
   */
  async findByPaymentStatus(isPaid: boolean): Promise<Income[]> {
    return this.incomeRepository.find({
      where: { isPaid },
      relations: ['client'],
      order: { date: 'DESC' },
    });
  }

  /**
   * Updates an existing income record.
   *
   * If `subtotalCents` or `gstCents` changes, `totalCents` is recalculated.
   *
   * @param id - The income UUID
   * @param updateIncomeDto - The fields to update
   * @returns The updated income
   * @throws NotFoundException if income or client not found
   */
  async update(id: string, updateIncomeDto: UpdateIncomeDto): Promise<Income> {
    const income = await this.findOne(id);

    // If client is being changed, validate it exists
    if (updateIncomeDto.clientId && updateIncomeDto.clientId !== income.clientId) {
      const clientExists = await this.clientRepository.count({
        where: { id: updateIncomeDto.clientId },
      });
      if (clientExists === 0) {
        throw new NotFoundException(`Client with ID "${updateIncomeDto.clientId}" not found`);
      }
    }

    // Convert date string to Date object if provided
    if (updateIncomeDto.date) {
      Object.assign(income, { date: new Date(updateIncomeDto.date) });
      delete updateIncomeDto.date;
    }

    // Apply updates
    Object.assign(income, updateIncomeDto);

    // Recalculate total if subtotal or GST changed
    income.totalCents = this.moneyService.addAmounts(income.subtotalCents, income.gstCents);

    await this.incomeRepository.save(income);

    return this.findOne(id);
  }

  /**
   * Removes an income record.
   *
   * @param id - The income UUID
   * @throws NotFoundException if income doesn't exist
   */
  async remove(id: string): Promise<void> {
    const income = await this.findOne(id);
    await this.incomeRepository.remove(income);
  }

  /**
   * Checks if an income exists by ID.
   *
   * @param id - The income UUID
   * @returns true if exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.incomeRepository.count({ where: { id } });
    return count > 0;
  }

  /**
   * Marks an income as paid.
   *
   * @param id - The income UUID
   * @returns The updated income
   * @throws NotFoundException if income doesn't exist
   */
  async markAsPaid(id: string): Promise<Income> {
    return this.update(id, { isPaid: true });
  }

  /**
   * Marks an income as unpaid.
   *
   * @param id - The income UUID
   * @returns The updated income
   * @throws NotFoundException if income doesn't exist
   */
  async markAsUnpaid(id: string): Promise<Income> {
    return this.update(id, { isPaid: false });
  }
}
