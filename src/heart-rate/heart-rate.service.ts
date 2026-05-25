import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HeartRateReading } from './heart-rate-reading.entity';
import { PatientsService } from '../patients/patients.service';
import { AnalyticsRangeQueryDto } from './dto/analytics-range-query.dto';
import { HeartRateEventsQueryDto } from './dto/heart-rate-events-query.dto';
import { AnalyticsResponseDto } from './dto/analytics-response.dto';
import { HeartRateEventsResponseDto } from './dto/heart-rate-events-response.dto';

interface AnalyticsRaw {
  count: string;
  avg: string | null;
  max: string | null;
  min: string | null;
}

@Injectable()
export class HeartRateService {
  constructor(
    @InjectRepository(HeartRateReading)
    private readonly readingRepository: Repository<HeartRateReading>,
    private readonly patientsService: PatientsService,
  ) {}

  async getEvents(
    patientId: string,
    query: HeartRateEventsQueryDto,
  ): Promise<HeartRateEventsResponseDto> {
    await this.patientsService.findOne(patientId);

    const qb = this.readingRepository
      .createQueryBuilder('r')
      .where('r.patientId = :patientId', { patientId })
      .andWhere('r.bpm > :threshold', { threshold: 100 })
      .orderBy('r.recordedAt', 'ASC');

    if (query.from && query.to) {
      qb.andWhere('r.recordedAt >= :from AND r.recordedAt <= :to', {
        from: new Date(query.from).toISOString(),
        to: new Date(query.to).toISOString(),
      });
    }

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const [readings, total] = await qb
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      patientId,
      pagination: { limit, offset, total },
      events: readings.map((r) => ({ bpm: r.bpm, recordedAt: r.recordedAt })),
    };
  }

  async getAnalytics(
    patientId: string,
    query: AnalyticsRangeQueryDto,
  ): Promise<AnalyticsResponseDto> {
    await this.patientsService.findOne(patientId);

    const result = (await this.readingRepository
      .createQueryBuilder('r')
      .select('COUNT(*)', 'count')
      .addSelect('AVG(r.bpm)', 'avg')
      .addSelect('MAX(r.bpm)', 'max')
      .addSelect('MIN(r.bpm)', 'min')
      .where('r.patientId = :patientId', { patientId })
      .andWhere('r.recordedAt >= :from AND r.recordedAt <= :to', {
        from: new Date(query.from).toISOString(),
        to: new Date(query.to).toISOString(),
      })
      .getRawOne<AnalyticsRaw>()) ?? {
      count: '0',
      avg: null,
      max: null,
      min: null,
    };

    const count = parseInt(result.count, 10);

    return {
      patientId,
      range: { from: query.from, to: query.to },
      analytics: {
        count,
        average:
          count > 0 && result.avg !== null
            ? Math.round(parseFloat(result.avg) * 10) / 10
            : null,
        max: count > 0 && result.max !== null ? parseFloat(result.max) : null,
        min: count > 0 && result.min !== null ? parseFloat(result.min) : null,
      },
    };
  }
}
