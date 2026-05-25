import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientResponseDto } from './dto/patient-response.dto';
import { RequestTrackingInterceptor } from '../common/interceptors/request-tracking.interceptor';
import { SkipTracking } from '../common/decorators/skip-tracking.decorator';

@Controller('patients')
@UseInterceptors(RequestTrackingInterceptor)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  async findAll(): Promise<PatientResponseDto[]> {
    const patients = await this.patientsService.findAll();
    return patients.map((p) => PatientResponseDto.fromEntity(p, false));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PatientResponseDto> {
    const patient = await this.patientsService.findOne(id);
    return PatientResponseDto.fromEntity(patient, true);
  }

  @Get(':id/request-count')
  @SkipTracking()
  async getRequestCount(@Param('id') id: string) {
    const requestCount = await this.patientsService.getRequestCount(id);
    return { patientId: id, requestCount };
  }
}
