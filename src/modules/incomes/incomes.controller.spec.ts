import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { IncomesController } from './incomes.controller';
import { IncomesService } from './incomes.service';
import { Client } from '../clients/entities/client.entity';

/**
 * Controller-level regression for the income payment-date contract (M02).
 *
 * Invalid dates and contradictory paid/date payloads must be rejected at the
 * HTTP validation boundary (400), not only in direct service calls.
 */
describe('IncomesController payment-date contract (HTTP path)', () => {
  let app: INestApplication;
  let markAsPaid: jest.Mock;
  let update: jest.Mock;

  const validIncomeId = '222e4567-e89b-12d3-a456-426614174000';

  beforeAll(async () => {
    markAsPaid = jest.fn();
    update = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncomesController],
      providers: [
        {
          provide: IncomesService,
          useValue: { markAsPaid, update },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PATCH /incomes/:id/paid', () => {
    it('rejects an empty body (payment date required)', async () => {
      const res = await request(app.getHttpServer()).patch(`/incomes/${validIncomeId}/paid`);

      expect(res.status).toBe(400);
      expect(markAsPaid).not.toHaveBeenCalled();
    });

    it('rejects an invalid payment date', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/incomes/${validIncomeId}/paid`)
        .send({ paymentDate: 'not-a-date' });

      expect(res.status).toBe(400);
      expect(markAsPaid).not.toHaveBeenCalled();
    });

    it('rejects a datetime instead of a date-only string', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/incomes/${validIncomeId}/paid`)
        .send({ paymentDate: '2026-07-02T14:30:00.000Z' });

      expect(res.status).toBe(400);
      expect(markAsPaid).not.toHaveBeenCalled();
    });

    it('forwards a valid payment date to the service', async () => {
      const client: Partial<Client> = { id: 'c1', name: 'Acme' };
      markAsPaid.mockResolvedValue({ id: validIncomeId, isPaid: true, client });

      const res = await request(app.getHttpServer())
        .patch(`/incomes/${validIncomeId}/paid`)
        .send({ paymentDate: '2026-07-02' });

      expect(res.status).toBe(200);
      expect(markAsPaid).toHaveBeenCalledWith(validIncomeId, '2026-07-02');
    });
  });

  describe('PATCH /incomes/:id (update)', () => {
    it('rejects an invalid paymentDate string at the boundary', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/incomes/${validIncomeId}`)
        .send({ paymentDate: '07/02/2026' });

      expect(res.status).toBe(400);
      expect(update).not.toHaveBeenCalled();
    });

    it('forwards a valid paymentDate payload to the service', async () => {
      update.mockResolvedValue({ id: validIncomeId, isPaid: true });

      const res = await request(app.getHttpServer())
        .patch(`/incomes/${validIncomeId}`)
        .send({ isPaid: true, paymentDate: '2026-07-02' });

      expect(res.status).toBe(200);
      expect(update).toHaveBeenCalledWith(validIncomeId, {
        isPaid: true,
        paymentDate: '2026-07-02',
      });
    });
  });
});
