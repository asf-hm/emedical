import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Patient {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column('integer')
  age!: number;

  @Column()
  gender!: string;

  @Column({ type: 'integer', default: 0 })
  requestCount!: number;
}
