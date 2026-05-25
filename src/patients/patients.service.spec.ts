import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PatientsService } from './patients.service';
import { Patient } from './patient.entity';

const mockPatient: Patient = {
  id: '1',
  name: 'Alice Johnson',
  age: 34,
  gender: 'female',
  requestCount: 3,
};

type MockRepo = Partial<Record<keyof Repository<Patient>, jest.Mock>>;

describe('PatientsService', () => {
  let service: PatientsService;
  let mockRepo: MockRepo & { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn().mockResolvedValue([mockPatient]),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: getRepositoryToken(Patient), useValue: mockRepo },
      ],
    }).compile();

    service = module.get(PatientsService);
  });

  it('findOne throws 404 for unknown patient', async () => {
    mockRepo.findOne!.mockResolvedValue(null);
    await expect(service.findOne('99')).rejects.toThrow(NotFoundException);
  });

  it('findOne returns patient when found', async () => {
    mockRepo.findOne!.mockResolvedValue(mockPatient);
    const result = await service.findOne('1');
    expect(result.id).toBe('1');
  });

  it('incrementRequestCount performs atomic update', async () => {
    const execMock = jest.fn().mockResolvedValue({});
    const setMock = jest.fn().mockReturnThis();
    const qb = {
      update: jest.fn().mockReturnThis(),
      set: setMock,
      where: jest.fn().mockReturnThis(),
      execute: execMock,
    };
    mockRepo.createQueryBuilder.mockReturnValue(qb);

    await service.incrementRequestCount('1');

    expect(execMock).toHaveBeenCalledTimes(1);
    const calls = setMock.mock.calls as [{ requestCount: () => string }][];
    const setArg = calls[0][0];
    expect(setArg.requestCount()).toBe('"requestCount" + 1');
  });

  it('getRequestCount does not increment itself', async () => {
    mockRepo.findOne!.mockResolvedValue(mockPatient);
    const count = await service.getRequestCount('1');
    expect(count).toBe(3);
    expect(mockRepo.createQueryBuilder).not.toHaveBeenCalled();
  });
});
