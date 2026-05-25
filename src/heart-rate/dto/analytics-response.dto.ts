export class AnalyticsResponseDto {
  patientId!: string;
  range!: { from: string; to: string };
  analytics!: {
    count: number;
    average: number | null;
    max: number | null;
    min: number | null;
  };
}
