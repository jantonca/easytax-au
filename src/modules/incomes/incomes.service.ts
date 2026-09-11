import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Income } from './entities/income.entity';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { Client } from '../clients/entities/client.entity';
import { MoneyService } from '../../common/services/money.service';
import { australianTodayIso, parseStrictDateOnly } from '../../common/services/au-date';

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

    const isPaid = createIncomeDto.isPaid ?? false;
    if (isPaid && !createIncomeDto.paymentDate) {
      throw new BadRequestException(
        'paymentDate (YYYY-MM-DD) is required when isPaid is true: cash-basis BAS ' +
          'attributes income to the period in which payment was received',
      );
    }
    if (!isPaid && createIncomeDto.paymentDate !== undefined) {
      throw new BadRequestException(
        'paymentDate can only be set on a paid income: mark it paid with a receipt date',
      );
    }

    const income = this.incomeRepository.create({
      date: new Date(createIncomeDto.date),
      clientId: createIncomeDto.clientId,
      invoiceNum: createIncomeDto.invoiceNum ?? null,
      description: createIncomeDto.description ?? null,
      subtotalCents: createIncomeDto.subtotalCents,
      gstCents: createIncomeDto.gstCents,
      totalCents,
      isPaid,
      paymentDate:
        isPaid && createIncomeDto.paymentDate
          ? this.parseDateOnly(createIncomeDto.paymentDate)
          : null,
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
   * Payment-date rules (see docs/core/CASH-BASIS-DESIGN.md):
   * - newly marking an income paid requires a `paymentDate`;
   * - `paymentDate` on an unpaid income (or `isPaid: false` with a date) is a
   *   contradictory state and is rejected;
   * - `isPaid: false` clears `paymentDate`;
   * - an already-paid income may keep `paymentDate` null until reconciled.
   *
   * @param id - The income UUID
   * @param updateIncomeDto - The fields to update
   * @returns The updated income
   * @throws NotFoundException if income or client not found
   * @throws BadRequestException for contradictory paid/paymentDate payloads
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

    // Payment-date cross-field validation and application. `paymentDate` is
    // destructured up-front and removed from the spread payload so
    // Object.assign cannot overwrite the entity with a raw string.
    const { paymentDate, ...rest } = updateIncomeDto;
    const willBePaid = updateIncomeDto.isPaid ?? income.isPaid;

    if (paymentDate !== undefined && paymentDate !== null && !willBePaid) {
      throw new BadRequestException(
        'paymentDate cannot be set on an unpaid income: mark it paid with a receipt date',
      );
    }

    // Newly marking an income paid requires a REAL receipt date. An explicit
    // null does not satisfy this: DTO validation cannot catch it (class
    // validator's @IsOptional skips null), so the transition rule is enforced
    // here. An already-paid income MAY receive paymentDate null — that
    // deliberately re-enters the documented "receipt date unknown" state and
    // drops a captured date (see docs/core/CASH-BASIS-DESIGN.md).
    const newlyMarkedPaid = willBePaid && !income.isPaid;
    if (newlyMarkedPaid && (paymentDate === undefined || paymentDate === null)) {
      throw new BadRequestException(
        'paymentDate (YYYY-MM-DD) is required when marking an income as paid: ' +
          'cash-basis BAS attributes income to the period in which payment was received',
      );
    }

    Object.assign(income, rest);

    if (paymentDate !== undefined) {
      income.paymentDate = paymentDate === null ? null : this.parseDateOnly(paymentDate);
    }
    if (updateIncomeDto.isPaid === false) {
      income.paymentDate = null;
    }

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
   * Cash-basis BAS attributes income to the period in which payment was
   * received, so a receipt date is mandatory — no date is ever inferred from
   * the invoice date or the current date.
   *
   * @param id - The income UUID
   * @param paymentDate - The date payment was received (YYYY-MM-DD)
   * @returns The updated income
   * @throws NotFoundException if income doesn't exist
   * @throws BadRequestException if paymentDate is missing or invalid
   */
  async markAsPaid(id: string, paymentDate?: string): Promise<Income> {
    if (!paymentDate) {
      throw new BadRequestException(
        'paymentDate (YYYY-MM-DD) is required when marking an income as paid: ' +
          'cash-basis BAS attributes income to the period in which payment was received',
      );
    }
    // Validate the date early so the payload error does not depend on the
    // income currently being unpaid.
    this.parseDateOnly(paymentDate);
    return this.update(id, { isPaid: true, paymentDate });
  }

  /**
   * Marks an income as unpaid.
   *
   * Clearing the payment status also clears the recorded receipt date.
   *
   * @param id - The income UUID
   * @returns The updated income
   * @throws NotFoundException if income doesn't exist
   */
  async markAsUnpaid(id: string): Promise<Income> {
    return this.update(id, { isPaid: false });
  }

  /**
   * Parses a strict date-only string (YYYY-MM-DD) into a UTC-midnight Date.
   *
   * Rejects anything that is not exactly YYYY-MM-DD, any impossible calendar
   * date, and any date after the current Australian business day (Australia/
   * Sydney — a 07:00 Sydney receipt on July 1 is June 30 in UTC and must not
   * be rejected as "future"). Shared with the CSV import path via
   * `parseStrictDateOnly`.
   */
  private parseDateOnly(value: string): Date {
    const date = parseStrictDateOnly(value);
    if (!date) {
      throw new BadRequestException(
        `paymentDate "${value}" must be a valid date-only ISO string (YYYY-MM-DD)`,
      );
    }
    if (value > australianTodayIso()) {
      throw new BadRequestException(
        `paymentDate "${value}" is in the future; a payment cannot be received after today`,
      );
    }
    return date;
  }
}
