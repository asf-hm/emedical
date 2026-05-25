import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Patient } from './patients/patient.entity';
import { HeartRateReading } from './heart-rate/heart-rate-reading.entity';
import { PatientsModule } from './patients/patients.module';
import { HeartRateModule } from './heart-rate/heart-rate.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'emedical'),
        password: config.get('DB_PASSWORD', 'emedical'),
        database: config.get('DB_NAME', 'emedical'),
        entities: [Patient, HeartRateReading],
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    PatientsModule,
    HeartRateModule,
    SeedModule,
  ],
})
export class AppModule {}
