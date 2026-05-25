export class HeartRateEventsResponseDto {
  patientId!: string;
  pagination!: {
    limit: number;
    offset: number;
    total: number;
  };
  events!: {
    bpm: number;
    recordedAt: Date;
  }[];
}
