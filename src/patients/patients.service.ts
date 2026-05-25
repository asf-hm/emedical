import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  findAll(): Promise<Patient[]> {
    return this.patientRepository.find();
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({ where: { id } });
    if (!patient) {
      throw new NotFoundException(`Patient with id '${id}' not found`);
    }
    return patient;
  }

  async incrementRequestCount(id: string): Promise<void> {
    await this.patientRepository
      .createQueryBuilder()
      .update(Patient)
      .set({ requestCount: () => '"requestCount" + 1' })
      .where('id = :id', { id })
      .execute();
  }

  async getRequestCount(id: string): Promise<number> {
    const patient = await this.findOne(id);
    return patient.requestCount;
  }
}
