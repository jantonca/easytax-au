import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

describe('ClientsService', () => {
  let service: ClientsService;

  // Mock client data (using fake data, never real client info)
  const mockClient: Client = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Mock Corp Pty Ltd',
    abn: '12345678901',
    isPsiEligible: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const psiClient: Client = {
    id: '223e4567-e89b-12d3-a456-426614174000',
    name: 'PSI Client Ltd',
    abn: '98765432109',
    isPsiEligible: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: getRepositoryToken(Client),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a client with all fields', async () => {
      const createDto: CreateClientDto = {
        name: 'Mock Corp Pty Ltd',
        abn: '12345678901',
        isPsiEligible: false,
      };

      mockRepository.create.mockReturnValue(mockClient);
      mockRepository.save.mockResolvedValue(mockClient);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'Mock Corp Pty Ltd',
        abn: '12345678901',
        isPsiEligible: false,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockClient);
      expect(result).toEqual(mockClient);
    });

    it('should create a client with minimal data (name only)', async () => {
      const createDto: CreateClientDto = {
        name: 'Simple Client',
      };

      const minimalClient = {
        ...mockClient,
        name: 'Simple Client',
        abn: null,
        isPsiEligible: false,
      };

      mockRepository.create.mockReturnValue(minimalClient);
      mockRepository.save.mockResolvedValue(minimalClient);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'Simple Client',
        abn: null,
        isPsiEligible: false,
      });
      expect(result.abn).toBeNull();
      expect(result.isPsiEligible).toBe(false);
    });

    it('should create a PSI-eligible client', async () => {
      const createDto: CreateClientDto = {
        name: 'PSI Client Ltd',
        abn: '98765432109',
        isPsiEligible: true,
      };

      mockRepository.create.mockReturnValue(psiClient);
      mockRepository.save.mockResolvedValue(psiClient);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'PSI Client Ltd',
        abn: '98765432109',
        isPsiEligible: true,
      });
      expect(result.isPsiEligible).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return all clients ordered by name', async () => {
      const clients = [mockClient, psiClient];
      mockRepository.find.mockResolvedValue(clients);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no clients exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a client by ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockClient);

      const result = await service.findOne(mockClient.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockClient.id },
      });
      expect(result).toEqual(mockClient);
    });

    it('should throw NotFoundException if client not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct message', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toMatchObject({
        message: 'Client with ID "non-existent-id" not found',
      });
    });
  });

  describe('update', () => {
    it('should update client name', async () => {
      const updateDto: UpdateClientDto = { name: 'Updated Corp' };
      const updatedClient = { ...mockClient, name: 'Updated Corp' };

      mockRepository.findOne.mockResolvedValue({ ...mockClient });
      mockRepository.save.mockResolvedValue(updatedClient);

      const result = await service.update(mockClient.id, updateDto);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Corp');
    });

    it('should update PSI eligibility', async () => {
      const updateDto: UpdateClientDto = { isPsiEligible: true };
      const updatedClient = { ...mockClient, isPsiEligible: true };

      mockRepository.findOne.mockResolvedValue({ ...mockClient });
      mockRepository.save.mockResolvedValue(updatedClient);

      const result = await service.update(mockClient.id, updateDto);

      expect(result.isPsiEligible).toBe(true);
    });

    it('should update multiple fields', async () => {
      const updateDto: UpdateClientDto = {
        name: 'New Name Pty Ltd',
        abn: '11111111111',
        isPsiEligible: true,
      };
      const updatedClient = {
        ...mockClient,
        name: 'New Name Pty Ltd',
        abn: '11111111111',
        isPsiEligible: true,
      };

      mockRepository.findOne.mockResolvedValue({ ...mockClient });
      mockRepository.save.mockResolvedValue(updatedClient);

      const result = await service.update(mockClient.id, updateDto);

      expect(result.name).toBe('New Name Pty Ltd');
      expect(result.abn).toBe('11111111111');
      expect(result.isPsiEligible).toBe(true);
    });

    it('should throw NotFoundException when updating non-existent client', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a client', async () => {
      mockRepository.findOne.mockResolvedValue(mockClient);
      mockRepository.remove.mockResolvedValue(mockClient);

      await service.remove(mockClient.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockClient.id },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockClient);
    });

    it('should throw NotFoundException when removing non-existent client', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exists', () => {
    it('should return true if client exists', async () => {
      mockRepository.count.mockResolvedValue(1);

      const result = await service.exists(mockClient.id);

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { id: mockClient.id },
      });
      expect(result).toBe(true);
    });

    it('should return false if client does not exist', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.exists('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('findPsiEligible', () => {
    it('should return only PSI-eligible clients', async () => {
      mockRepository.find.mockResolvedValue([psiClient]);

      const result = await service.findPsiEligible();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isPsiEligible: true },
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].isPsiEligible).toBe(true);
    });

    it('should return empty array when no PSI-eligible clients exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findPsiEligible();

      expect(result).toEqual([]);
    });
  });
});
