import { Patient } from '../patient.entity';

export class PatientResponseDto {
  id!: string;
  name!: string;
  age!: number;
  gender!: string;
  requestCount?: number;

  static fromEntity(
    patient: Patient,
    includeRequestCount = false,
  ): PatientResponseDto {
    return {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      ...(includeRequestCount && { requestCount: patient.requestCount }),
    };
  }
}
