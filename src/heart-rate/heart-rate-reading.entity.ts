import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Patient } from '../patients/patient.entity';

@Entity()
@Index(['patientId', 'recordedAt'])
@Index(['bpm'])
export class HeartRateReading {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  patientId!: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient!: Patient;

  @Column('float')
  bpm!: number;

  @Column({ type: 'timestamptz' })
  recordedAt!: Date;
}
