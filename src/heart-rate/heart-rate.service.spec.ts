import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { HeartRateService } from './heart-rate.service';
import { HeartRateReading } from './heart-rate-reading.entity';
import { PatientsService } from '../patients/patients.service';

const mockPatient = {
  id: '1',
  name: 'Alice Johnson',
  age: 34,
  gender: 'female',
  requestCount: 0,
};

const mockReadings: Partial<HeartRateReading>[] = [
  {
    id: 1,
    patientId: '1',
    bpm: 85,
    recordedAt: new Date('2024-03-01T08:00:00Z'),
  },
  {
    id: 2,
    patientId: '1',
    bpm: 101,
    recordedAt: new Date('2024-03-01T10:30:00Z'),
  },
  {
    id: 3,
    patientId: '1',
    bpm: 97,
    recordedAt: new Date('2024-03-01T13:45:00Z'),
  },
  {
    id: 4,
    patientId: '1',
    bpm: 100,
    recordedAt: new Date('2024-03-01T15:00:00Z'),
  },
];

interface QbMock {
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  select: jest.Mock;
  addSelect: jest.Mock;
  getManyAndCount: jest.Mock;
  getRawOne: jest.Mock;
}

function buildQbMock(
  rows: Partial<HeartRateReading>[],
  rawResult?: object,
): QbMock {
  const qb: QbMock = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([rows, rows.length]),
    getRawOne: jest.fn().mockResolvedValue(rawResult ?? {}),
  };
  return qb;
}

describe('HeartRateService', () => {
  let service: HeartRateService;
  let patientsService: jest.Mocked<PatientsService>;
  let readingRepositoryFactory: jest.MockedFunction<() => QbMock>;

  beforeEach(async () => {
    patientsService = {
      findOne: jest.fn().mockResolvedValue(mockPatient),
      findAll: jest.fn(),
      incrementRequestCount: jest.fn(),
      getRequestCount: jest.fn(),
    } as unknown as jest.Mocked<PatientsService>;

    readingRepositoryFactory = jest.fn() as jest.MockedFunction<() => QbMock>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HeartRateService,
        { provide: PatientsService, useValue: patientsService },
        {
          provide: getRepositoryToken(HeartRateReading),
          useValue: { createQueryBuilder: readingRepositoryFactory },
        },
      ],
    }).compile();

    service = module.get(HeartRateService);
  });

  describe('getEvents', () => {
    it('queries with bpm > 100 threshold', async () => {
      const qb = buildQbMock([]);
      readingRepositoryFactory.mockReturnValue(qb);

      await service.getEvents('1', { limit: 20, offset: 0 });

      expect(qb.andWhere).toHaveBeenCalledWith('r.bpm > :threshold', {
        threshold: 100,
      });
    });

    it('returns only readings strictly above 100 bpm', async () => {
      const highReadings = mockReadings.filter((r) => r.bpm! > 100);
      const qb = buildQbMock(highReadings);
      readingRepositoryFactory.mockReturnValue(qb);

      const result = await service.getEvents('1', { limit: 20, offset: 0 });

      expect(result.events).toHaveLength(1);
      expect(result.events[0].bpm).toBe(101);
    });

    it('does not return readings with bpm === 100', async () => {
      const highReadings = mockReadings.filter((r) => r.bpm! > 100);
      const qb = buildQbMock(highReadings);
      readingRepositoryFactory.mockReturnValue(qb);

      const result = await service.getEvents('1', { limit: 20, offset: 0 });

      const hasBpm100 = result.events.some((e) => e.bpm === 100);
      expect(hasBpm100).toBe(false);
    });

    it('returns empty events when no readings exceed 100', async () => {
      const qb = buildQbMock([]);
      readingRepositoryFactory.mockReturnValue(qb);

      const result = await service.getEvents('1', { limit: 20, offset: 0 });

      expect(result.events).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('throws 404 when patient does not exist', async () => {
      patientsService.findOne.mockRejectedValue(new NotFoundException());
      const qb = buildQbMock([]);
      readingRepositoryFactory.mockReturnValue(qb);

      await expect(
        service.getEvents('99', { limit: 20, offset: 0 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAnalytics', () => {
    it('returns correct avg, max, min, count for readings in range', async () => {
      const rawResult = { count: '3', avg: '94.333', max: '101', min: '85' };
      const qb = buildQbMock([], rawResult);
      readingRepositoryFactory.mockReturnValue(qb);

      const result = await service.getAnalytics('1', {
        from: '2024-03-01T00:00:00Z',
        to: '2024-03-01T23:59:59Z',
      });

      expect(result.analytics.count).toBe(3);
      expect(result.analytics.average).toBe(94.3);
      expect(result.analytics.max).toBe(101);
      expect(result.analytics.min).toBe(85);
    });

    it('returns null analytics when no readings in range', async () => {
      const rawResult = { count: '0', avg: null, max: null, min: null };
      const qb = buildQbMock([], rawResult);
      readingRepositoryFactory.mockReturnValue(qb);

      const result = await service.getAnalytics('1', {
        from: '2020-01-01T00:00:00Z',
        to: '2020-01-02T00:00:00Z',
      });

      expect(result.analytics.count).toBe(0);
      expect(result.analytics.average).toBeNull();
      expect(result.analytics.max).toBeNull();
      expect(result.analytics.min).toBeNull();
    });

    it('throws 404 when patient does not exist', async () => {
      patientsService.findOne.mockRejectedValue(new NotFoundException());
      const qb = buildQbMock([], {});
      readingRepositoryFactory.mockReturnValue(qb);

      await expect(
        service.getAnalytics('99', {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-02T00:00:00Z',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
