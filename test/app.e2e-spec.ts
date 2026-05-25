/**
 * E2e tests require a running PostgreSQL instance.
 * Start the database before running: docker-compose up -d
 * Then run: npm run test:e2e
 *
 * These tests use the real database and seed data from patients.json.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface PatientListItem {
  id: string;
  name: string;
  age: number;
  gender: string;
}

interface PatientDetail extends PatientListItem {
  requestCount: number;
}

interface Analytics {
  count: number;
  average: number | null;
  max: number | null;
  min: number | null;
}

interface AnalyticsBody {
  analytics: Analytics;
}

interface EventsBody {
  events: { bpm: number; recordedAt: string }[];
}

interface RequestCountBody {
  patientId: string;
  requestCount: number;
}

describe('EMedical API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /patients', () => {
    it('returns a list of patients without requestCount', async () => {
      const res = await request(app.getHttpServer())
        .get('/patients')
        .expect(200);
      const body = res.body as PatientListItem[];
      expect(Array.isArray(body)).toBe(true);
      expect(body[0]).toHaveProperty('id');
      expect(body[0]).toHaveProperty('name');
      expect(body[0]).not.toHaveProperty('requestCount');
    });
  });

  describe('GET /patients/:id', () => {
    it('returns a single patient with requestCount', async () => {
      const res = await request(app.getHttpServer())
        .get('/patients/1')
        .expect(200);
      const body = res.body as PatientDetail;
      expect(body.id).toBe('1');
      expect(body).toHaveProperty('requestCount');
    });

    it('returns 404 for unknown patient', async () => {
      await request(app.getHttpServer()).get('/patients/99').expect(404);
    });
  });

  describe('GET /patients/:id/heart-rate/events', () => {
    it('returns only events with bpm > 100', async () => {
      const res = await request(app.getHttpServer())
        .get('/patients/1/heart-rate/events')
        .expect(200);
      const body = res.body as EventsBody;
      expect(body).toHaveProperty('events');
      expect(body.events.every((e) => e.bpm > 100)).toBe(true);
    });

    it('returns 400 when only from is provided', async () => {
      await request(app.getHttpServer())
        .get('/patients/1/heart-rate/events?from=2024-03-01T00:00:00Z')
        .expect(400);
    });
  });

  describe('GET /patients/:id/heart-rate/analytics', () => {
    it('returns analytics with count, average, max, min', async () => {
      const res = await request(app.getHttpServer())
        .get(
          '/patients/1/heart-rate/analytics?from=2024-03-01T00:00:00Z&to=2024-03-01T23:59:59Z',
        )
        .expect(200);
      const body = res.body as AnalyticsBody;
      expect(body.analytics).toHaveProperty('count');
      expect(body.analytics).toHaveProperty('average');
      expect(body.analytics).toHaveProperty('max');
      expect(body.analytics).toHaveProperty('min');
    });

    it('returns 400 when from >= to', async () => {
      await request(app.getHttpServer())
        .get(
          '/patients/1/heart-rate/analytics?from=2024-03-02T00:00:00Z&to=2024-03-01T00:00:00Z',
        )
        .expect(400);
    });

    it('returns 200 with null analytics when no readings in range', async () => {
      const res = await request(app.getHttpServer())
        .get(
          '/patients/1/heart-rate/analytics?from=2020-01-01T00:00:00Z&to=2020-01-02T00:00:00Z',
        )
        .expect(200);
      const body = res.body as AnalyticsBody;
      expect(body.analytics.count).toBe(0);
      expect(body.analytics.average).toBeNull();
    });

    it('returns 404 for unknown patient', async () => {
      await request(app.getHttpServer())
        .get(
          '/patients/99/heart-rate/analytics?from=2024-01-01T00:00:00Z&to=2024-01-02T00:00:00Z',
        )
        .expect(404);
    });
  });

  describe('GET /patients/:id/request-count', () => {
    it('returns requestCount without incrementing it', async () => {
      const before = await request(app.getHttpServer())
        .get('/patients/1/request-count')
        .expect(200);
      const after = await request(app.getHttpServer())
        .get('/patients/1/request-count')
        .expect(200);
      const beforeBody = before.body as RequestCountBody;
      const afterBody = after.body as RequestCountBody;
      expect(afterBody.requestCount).toBe(beforeBody.requestCount);
    });

    it('increments requestCount when patient detail is fetched', async () => {
      const before = await request(app.getHttpServer())
        .get('/patients/1/request-count')
        .expect(200);
      await request(app.getHttpServer()).get('/patients/1').expect(200);
      const after = await request(app.getHttpServer())
        .get('/patients/1/request-count')
        .expect(200);
      const beforeBody = before.body as RequestCountBody;
      const afterBody = after.body as RequestCountBody;
      expect(afterBody.requestCount).toBe(beforeBody.requestCount + 1);
    });
  });
});
