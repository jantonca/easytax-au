import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

/**
 * Service for managing Client entities.
 *
 * Handles CRUD operations for clients (people/companies who pay you).
 * Sensitive fields (name, abn) are automatically encrypted/decrypted
 * by the EncryptedColumnTransformer.
 */
@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  /**
   * Creates a new client.
   *
   * @param createClientDto - The client data
   * @returns The created client (with decrypted fields)
   */
  async create(createClientDto: CreateClientDto): Promise<Client> {
    const client = this.clientRepository.create({
      name: createClientDto.name,
      abn: createClientDto.abn ?? null,
      isPsiEligible: createClientDto.isPsiEligible ?? false,
    });

    return this.clientRepository.save(client);
  }

  /**
   * Retrieves all clients.
   *
   * @returns Array of all clients, ordered by name
   */
  async findAll(): Promise<Client[]> {
    return this.clientRepository.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Retrieves a single client by ID.
   *
   * @param id - The client UUID
   * @returns The client
   * @throws NotFoundException if client doesn't exist
   */
  async findOne(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { id } });

    if (!client) {
      throw new NotFoundException(`Client with ID "${id}" not found`);
    }

    return client;
  }

  /**
   * Updates an existing client.
   *
   * @param id - The client UUID
   * @param updateClientDto - The fields to update
   * @returns The updated client
   * @throws NotFoundException if client doesn't exist
   */
  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);

    // Merge provided fields into existing client
    Object.assign(client, updateClientDto);

    return this.clientRepository.save(client);
  }

  /**
   * Removes a client.
   *
   * @param id - The client UUID
   * @throws NotFoundException if client doesn't exist
   */
  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await this.clientRepository.remove(client);
  }

  /**
   * Checks if a client exists by ID.
   *
   * @param id - The client UUID
   * @returns true if exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.clientRepository.count({ where: { id } });
    return count > 0;
  }

  /**
   * Finds all clients subject to PSI rules.
   *
   * @returns Array of PSI-eligible clients
   */
  async findPsiEligible(): Promise<Client[]> {
    return this.clientRepository.find({
      where: { isPsiEligible: true },
      order: { name: 'ASC' },
    });
  }
}
