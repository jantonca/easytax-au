import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let mockDataSource: Partial<DataSource>;

  beforeEach(async () => {
    mockDataSource = {
      isInitialized: true,
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return ok status when database is connected', () => {
      const result = appController.getHealth();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(result.timestamp).toBeDefined();
    });

    it('should return error status when database is disconnected', () => {
      mockDataSource.isInitialized = false;

      const result = appController.getHealth();

      expect(result.status).toBe('error');
      expect(result.database).toBe('disconnected');
    });

    it('should return a valid ISO timestamp', () => {
      const result = appController.getHealth();
      const date = new Date(result.timestamp);

      expect(date.toISOString()).toBe(result.timestamp);
    });
  });
});
