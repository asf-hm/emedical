import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../patients/patient.entity';
import { HeartRateReading } from '../heart-rate/heart-rate-reading.entity';
import * as fs from 'fs';
import * as path from 'path';

interface SeedPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
}

interface SeedReading {
  patientId: string;
  timestamp: string;
  heartRate: number;
}

interface SeedData {
  patients: SeedPatient[];
  heartRateReadings: SeedReading[];
}

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(HeartRateReading)
    private readonly readingRepository: Repository<HeartRateReading>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.NODE_ENV === 'production') return;

    const existing = await this.patientRepository.count();
    if (existing > 0) {
      this.logger.log('Seed skipped — data already exists');
      return;
    }

    const filePath = path.join(__dirname, 'patients.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as SeedData;

    const patients = data.patients.map((p) =>
      this.patientRepository.create({
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        requestCount: 0,
      }),
    );
    await this.patientRepository.save(patients);

    const readings = data.heartRateReadings.map((r) =>
      this.readingRepository.create({
        patientId: r.patientId,
        bpm: r.heartRate,
        recordedAt: new Date(r.timestamp),
      }),
    );
    await this.readingRepository.save(readings);

    this.logger.log(
      `Seeded ${patients.length} patients and ${readings.length} heart rate readings`,
    );
  }
}
