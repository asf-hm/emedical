import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeartRateReading } from './heart-rate-reading.entity';
import { HeartRateService } from './heart-rate.service';
import { HeartRateController } from './heart-rate.controller';
import { PatientsModule } from '../patients/patients.module';
import { RequestTrackingInterceptor } from '../common/interceptors/request-tracking.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([HeartRateReading]), PatientsModule],
  providers: [HeartRateService, RequestTrackingInterceptor],
  controllers: [HeartRateController],
})
export class HeartRateModule {}
