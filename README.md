# EMedical Backend

A NestJS backend service for managing patients and heart rate readings.

## Prerequisites

- Node.js 18+
- Docker and Docker Compose

## Setup & Run

```bash
# 1. Start the PostgreSQL database
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Copy environment config
cp .env.example .env

# 4. Start the server
npm run start:dev
```

The server runs on `http://localhost:3000`.

On first start, `patients.json` is seeded automatically. Subsequent restarts skip seeding if data already exists.

## Run Tests

```bash
npm test
```

## API Endpoints

### List all patients
```bash
curl http://localhost:3000/patients
```

### Get patient by ID
```bash
curl http://localhost:3000/patients/1
```

### Get request count for a patient
```bash
curl http://localhost:3000/patients/1/request-count
```

### High heart rate events (bpm > 100)
```bash
# All events
curl http://localhost:3000/patients/1/heart-rate/events

# With optional time range and pagination
curl "http://localhost:3000/patients/1/heart-rate/events?from=2024-03-01T00:00:00Z&to=2024-03-02T23:59:59Z&limit=20&offset=0"
```

### Heart rate analytics
```bash
curl "http://localhost:3000/patients/1/heart-rate/analytics?from=2024-03-01T00:00:00Z&to=2024-03-01T23:59:59Z"
```

### Error examples
```bash
# Invalid date range (from >= to)
curl "http://localhost:3000/patients/1/heart-rate/analytics?from=2024-03-02T00:00:00Z&to=2024-03-01T00:00:00Z"

# Missing patient
curl http://localhost:3000/patients/99
```

## Seed Behavior

- Runs automatically on app bootstrap when `NODE_ENV !== 'production'`
- Loads `src/seed/patients.json` — the dataset provided with the assignment
- Idempotent: skips if any patients already exist in the database
- Field mapping: `heartRate` → `bpm`, `timestamp` → `recordedAt`

## Design Decisions

**PostgreSQL over SQLite:** Native `timestamptz` gives correct range queries without workarounds. Local setup is handled by `docker-compose.yml` — one command to start.

**Request tracking via interceptor:** `RequestTrackingInterceptor` is applied at controller level, fires only on successful (2xx) responses via RxJS `tap({ next })`, and calls `PatientsService.incrementRequestCount()` for an atomic SQL increment. Tracking errors are caught and logged without affecting the response. The `@SkipTracking()` decorator (backed by `Reflector`) exempts the `request-count` endpoint from inflating its own counter.

**Tracked routes:** `GET /patients/:id`, `GET /patients/:id/heart-rate/events`, `GET /patients/:id/heart-rate/analytics`. Not tracked: `GET /patients` (list-level), `GET /patients/:id/request-count`, any failed request.

**`requestCount` visibility:** Excluded from `GET /patients` list response to keep list payloads lean. Included in `GET /patients/:id` detail response. Also available via the dedicated `GET /patients/:id/request-count` endpoint for lightweight monitoring.

**Date range validation:** `from < to` is enforced via a `class-validator` custom constraint (`IsFromBeforeToConstraint`) placed on the `to` field. The "both or neither" rule for the optional events range is handled explicitly in the controller — `@IsOptional()` short-circuits class-validator on absent fields, making a DTO-level constraint unreliable for this case.

**Empty analytics:** When a patient exists but no readings fall in the requested range, the endpoint returns `200` with `count: 0` and `null` for `average`, `max`, and `min`. A `404` would be semantically wrong — the patient exists.

## Known Limitations

- **No authentication:** All endpoints are public. Production would require JWT-gated access.
- **Offset pagination:** The events endpoint uses `limit`/`offset`. Cursor-based pagination is more stable under concurrent inserts but was out of scope.
- **Request tracking write pressure:** `requestCount` is stored on the `Patient` row. Under high concurrency, every GET becomes a write. Production would use a separate `RequestLog` table or a Redis counter.
- **No rate limiting:** Large analytics queries over wide time ranges are unrestricted.
- **`synchronize: true`:** TypeORM auto-syncs the schema on startup. Production should use migrations.

## Suggested Production Improvements

- Replace `requestCount` column with a `RequestLog` table or Redis counter
- Add cursor-based pagination for the events endpoint
- Cache analytics results for frequent time ranges (Redis with short TTL)
- Add JWT authentication to all patient endpoints
- Add rate limiting on the analytics endpoint
- Switch from `synchronize: true` to TypeORM migrations
