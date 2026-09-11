// Guard runs before anything reads application configuration.
import { assertDisposableDatabaseTarget } from './guards/disposable-db-guard';

assertDisposableDatabaseTarget();

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Runtime validation for the Multer 2.3.0 parser (M01).
 *
 * Must run against a disposable local backend only: the malformed multipart
 * requests below deliberately exercise parser failure paths and must never be
 * pointed at a shared or deployed service. The follow-up request after each
 * hostile request proves the process did not crash.
 */
describe('multipart parser hardening (e2e, disposable DB)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // For the preview-path test the provider need not exist: a missing provider
  // fails the row without crashing, which is exactly what this check asserts.
  const validCsv = 'Date,Item,Total,GST\n2026-05-10,Internet,$88.00,$8.00\n';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    dataSource = module.get(DataSource);
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

  // Explicit connection teardown: without it the TypeORM pool can keep the
  // Jest process alive until the job timeout (S05).
  afterAll(async () => {
    await app.close();
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('rejects an oversized upload (5MB limit) and keeps serving', async () => {
    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1, 'a', 'binary');

    const res = await request(app.getHttpServer())
      .post('/import/expenses')
      .attach('file', oversized, { filename: 'big.csv', contentType: 'text/csv' });

    expect([400, 413]).toContain(res.status);

    const followUp = await request(app.getHttpServer()).get('/health');
    expect(followUp.status).toBe(200);
  });

  it('rejects malformed multipart bodies without crashing the parser', async () => {
    // Multipart with malformed framing (missing terminating boundary)
    const brokenMultipart = Buffer.from(
      '--xboundary\r\n' +
        'Content-Disposition: form-data; name="file"; filename="x.csv"\r\n' +
        'Content-Type: text/csv\r\n\r\n' +
        'Date,Item,Total\r\n' + // boundary never closed
        'trailing garbage without terminator',
    );

    const res = await request(app.getHttpServer())
      .post('/import/expenses')
      .set('Content-Type', 'multipart/form-data; boundary=xboundary')
      .send(brokenMultipart);

    // Any 4xx/5xx is fine: the point is that the process survives
    expect(res.status).toBeGreaterThanOrEqual(400);

    const followUp = await request(app.getHttpServer()).get('/health');
    expect(followUp.status).toBe(200);
  });

  it('rejects non-CSV uploads and keeps serving', async () => {
    const res = await request(app.getHttpServer())
      .post('/import/expenses')
      .attach('file', Buffer.from('not a csv'), {
        filename: 'payload.bin',
        contentType: 'application/octet-stream',
      });

    expect(res.status).toBe(400);

    const followUp = await request(app.getHttpServer()).get('/health');
    expect(followUp.status).toBe(200);
  });

  it('still accepts a normal CSV upload path (service-level contract intact)', async () => {
    // Providers/categories may be empty: the import reports per-row failures
    // rather than crashing, which is enough to prove the parser path works.
    const res = await request(app.getHttpServer())
      .post('/import/expenses/preview')
      .field('source', 'custom')
      .attach('file', Buffer.from(validCsv), 'expenses.csv');

    expect(res.status).toBe(200);
    expect(res.body.importJobId).toBeNull();
    expect(res.body.totalRows).toBe(1);
  });
});
