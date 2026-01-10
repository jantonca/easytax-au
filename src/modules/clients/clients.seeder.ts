import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';

/**
 * Default test clients for development and E2E testing.
 * These are encrypted at rest using AES-256-GCM.
 */
const DEFAULT_CLIENTS = [
  {
    name: 'Acme Corporation',
    abn: '12345678901',
  },
  {
    name: 'Tech Startup Pty Ltd',
    abn: '98765432109',
  },
  {
    name: 'Local Business Co',
    abn: '11223344556',
  },
];

/**
 * Seeds default test clients on application startup in test/development environments.
 * Only inserts clients that don't already exist.
 */
@Injectable()
export class ClientsSeeder implements OnModuleInit {
  private readonly logger = new Logger(ClientsSeeder.name);

  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async onModuleInit(): Promise<void> {
    // Only seed in test or development environments
    const env = process.env.NODE_ENV || 'development';
    if (env === 'production') {
      this.logger.log('Skipping client seeding in production environment');
      return;
    }

    await this.seed();
  }

  /**
   * Seeds default test clients if they don't exist.
   */
  async seed(): Promise<void> {
    const existingCount = await this.clientRepository.count();

    if (existingCount > 0) {
      this.logger.log(`Clients already seeded (${existingCount} found), skipping...`);
      return;
    }

    this.logger.log('Seeding default test clients...');

    for (const clientData of DEFAULT_CLIENTS) {
      const client = this.clientRepository.create(clientData);
      await this.clientRepository.save(client);
    }

    this.logger.log(`Seeded ${DEFAULT_CLIENTS.length} default test clients`);
  }
}
