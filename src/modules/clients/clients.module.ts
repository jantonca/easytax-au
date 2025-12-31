import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';

/**
 * Module for managing Client entities.
 *
 * Clients represent people or companies who pay you for freelance work.
 * Sensitive fields (name, abn) are encrypted at rest using AES-256-GCM.
 *
 * @provides ClientsService
 * @exports ClientsService, TypeOrmModule (for Client entity)
 */
@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService, TypeOrmModule],
})
export class ClientsModule {}
