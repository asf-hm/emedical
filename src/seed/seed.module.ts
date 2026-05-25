import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../patients/patient.entity';
import { HeartRateReading } from '../heart-rate/heart-rate-reading.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, HeartRateReading])],
  providers: [SeedService],
})
export class SeedModule {}
