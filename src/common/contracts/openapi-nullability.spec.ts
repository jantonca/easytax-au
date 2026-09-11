import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, ApiOkResponse } from '@nestjs/swagger';
import { ExpenseResponseDto } from '../../modules/expenses/dto/expense-response.dto';
import { RecurringExpenseResponseDto } from '../../modules/recurring-expenses/dto/recurring-expense-response.dto';
import { CreateIncomeDto } from '../../modules/incomes/dto/create-income.dto';
import { UpdateIncomeDto } from '../../modules/incomes/dto/update-income.dto';
import { IncomeResponseDto } from '../../modules/incomes/dto/income-response.dto';

/**
 * OpenAPI contract regression (M06 + U01): nullable response fields must
 * advertise `nullable: true` so the generated shared types keep `| null`, and
 * nullable STRING input fields must advertise `type: "string"` (a bare
 * `string | null` infers `type: object` from the union, which would corrupt
 * the contract on regeneration).
 */
@Controller('contract-stub')
class ContractStubController {
  @Get('expenses')
  @ApiOkResponse({ type: ExpenseResponseDto })
  expenses(): ExpenseResponseDto {
    return undefined as unknown as ExpenseResponseDto;
  }

  @Get('recurring')
  @ApiOkResponse({ type: RecurringExpenseResponseDto })
  recurring(): RecurringExpenseResponseDto {
    return undefined as unknown as RecurringExpenseResponseDto;
  }

  @Get('income-create')
  @ApiOkResponse({ type: CreateIncomeDto })
  incomeCreate(): CreateIncomeDto {
    return undefined as unknown as CreateIncomeDto;
  }

  @Get('income-update')
  @ApiOkResponse({ type: UpdateIncomeDto })
  incomeUpdate(): UpdateIncomeDto {
    return undefined as unknown as UpdateIncomeDto;
  }

  @Get('income-response')
  @ApiOkResponse({ type: IncomeResponseDto })
  incomeResponse(): IncomeResponseDto {
    return undefined as unknown as IncomeResponseDto;
  }
}

let app: INestApplication;

beforeAll(async () => {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [ContractStubController],
  }).compile();

  app = module.createNestApplication();
  await app.init();
});

afterAll(async () => {
  await app.close();
});

function schemaFor(dtoName: string): {
  properties: Record<string, Record<string, unknown>>;
  required?: string[];
} {
  const config = new DocumentBuilder().setTitle('contract-test').build();
  const document = SwaggerModule.createDocument(app, config);
  const schemas = document.components?.schemas;
  if (!schemas || !(dtoName in schemas)) {
    throw new Error(`Schema "${dtoName}" missing from generated document`);
  }
  const schema = schemas[dtoName] as {
    properties: Record<string, Record<string, unknown>>;
    required?: string[];
  };
  return schema;
}

describe('OpenAPI nullability metadata (M06)', () => {
  it('ExpenseResponseDto marks description, fileRef and importJobId nullable', () => {
    const schema = schemaFor('ExpenseResponseDto');

    for (const field of ['description', 'fileRef', 'importJobId']) {
      expect(schema.properties[field]).toEqual(expect.objectContaining({ nullable: true }));
    }
  });

  it('RecurringExpenseResponseDto marks description, endDate and lastGeneratedDate nullable', () => {
    const schema = schemaFor('RecurringExpenseResponseDto');

    for (const field of ['description', 'endDate', 'lastGeneratedDate']) {
      expect(schema.properties[field]).toEqual(expect.objectContaining({ nullable: true }));
    }
  });

  it('non-optional fields stay non-nullable', () => {
    const schema = schemaFor('ExpenseResponseDto');

    expect(schema.properties['amountCents']).toEqual(
      expect.not.objectContaining({ nullable: true }),
    );
  });

  it('CreateIncomeDto.paymentDate is a nullable string, not an object (U01)', () => {
    const schema = schemaFor('CreateIncomeDto');

    expect(schema.properties['paymentDate']).toEqual(
      expect.objectContaining({ type: 'string', nullable: true }),
    );
    expect(schema.properties['paymentDate']).not.toHaveProperty('type', 'object');
  });

  it('UpdateIncomeDto exposes paymentDate as a nullable optional string (U01)', () => {
    const schema = schemaFor('UpdateIncomeDto');

    expect(schema.properties['paymentDate']).toEqual(
      expect.objectContaining({ type: 'string', nullable: true }),
    );
    expect(schema.required ?? []).not.toContain('paymentDate');
  });

  it('IncomeResponseDto is not an empty schema and exposes paymentDate (D01)', () => {
    const schema = schemaFor('IncomeResponseDto');

    // The pre-existing defect: the entity had no metadata, so the generated
    // Income schema was an empty object (Record<string, never>).
    expect(Object.keys(schema.properties).length).toBeGreaterThan(5);
    expect(schema.properties['paymentDate']).toEqual(
      expect.objectContaining({ type: 'string', nullable: true }),
    );
    expect(schema.properties['client']).toBeDefined();
    expect(schema.required ?? []).toEqual(
      expect.arrayContaining(['id', 'date', 'isPaid', 'totalCents', 'client']),
    );
  });

  it('IncomeResponseDto date formats match the date-only serialization (E01)', () => {
    const schema = schemaFor('IncomeResponseDto');

    // PostgreSQL date columns hydrate as plain date strings, so the invoice
    // date must advertise `format: date` (NOT date-time) with a date-only
    // example; paymentDate's example must be date-only as well.
    expect(schema.properties['date']).toEqual(
      expect.objectContaining({ type: 'string', format: 'date' }),
    );
    expect(schema.properties['date']).not.toHaveProperty('format', 'date-time');
    expect(schema.properties['date']['example']).toBe('2026-06-30');

    const paymentDate = schema.properties['paymentDate'] as { example?: string };
    expect(paymentDate.example).toBe('2026-07-02');
    expect(paymentDate.example).not.toMatch(/T\d{2}:\d{2}/);

    // Actual timestamps keep date-time
    for (const ts of ['createdAt', 'updatedAt']) {
      expect(schema.properties[ts]).toEqual(
        expect.objectContaining({ type: 'string', format: 'date-time' }),
      );
    }
  });
});
