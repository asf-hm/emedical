import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './patient.entity';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { RequestTrackingInterceptor } from '../common/interceptors/request-tracking.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([Patient])],
  providers: [PatientsService, RequestTrackingInterceptor],
  controllers: [PatientsController],
  exports: [PatientsService],
})
export class PatientsModule {}
