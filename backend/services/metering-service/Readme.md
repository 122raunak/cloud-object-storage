# Metering Service

Tracks and aggregates file storage usage per user in real time.

---

## Features

- Consumes storage events from `storage-events-metering` BullMQ queue
- Idempotent event recording — duplicate events ignored via `event_id` unique constraint
- Real-time live summary updates on every event (same DB transaction)
- Daily and monthly usage aggregation via cron jobs
- Event log with full audit trail per user

---

## How It Works
Storage Service publishes event
│
▼
BullMQ queue: storage-events-metering
│
▼
Metering Worker receives event
│
▼
INSERT into usage_events (idempotent — ON CONFLICT DO NOTHING)
│
▼
UPDATE usage_summaries (daily + monthly) in same transaction
│
▼
Usage immediately available via API
---

## Event Deltas

Each event type updates summaries differently:

| Event | bytes_uploaded | bytes_downloaded | file_count | storage_used | api_calls |
|---|---|---|---|---|---|
| `file.uploaded` | +bytes | 0 | +1 | +bytes | +1 |
| `file.downloaded` | 0 | +bytes | 0 | 0 | +1 |
| `file.deleted` | 0 | 0 | -1 | -bytes | +1 |
| `file.restored` | 0 | 0 | +1 | +bytes | 0 |

---

## Aggregation Jobs

| Job | Schedule | Purpose |
|---|---|---|
| Hourly | `0 * * * *` | Re-aggregate today's daily summary |
| Midnight | `5 0 * * *` | Finalize yesterday + recompute current month |
| Monthly | `10 0 1 * *` | Finalize previous month after rollover |

All aggregation uses a single set-based SQL query — no per-user loops.

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/metering/usage/:userId` | Owner or Admin | Current daily + monthly summary |
| GET | `/api/metering/usage/:userId/daily?days=30` | Owner or Admin | Daily breakdown (max 365 days) |
| GET | `/api/metering/usage/:userId/monthly?months=12` | Owner or Admin | Monthly breakdown (max 60 months) |
| GET | `/api/metering/events/:userId` | Owner or Admin | Raw event log with pagination |

---

## Database Schema

**`usage_events`** — raw event log, append-only
```sql
event_id    VARCHAR  UNIQUE  -- idempotency key
user_id     VARCHAR
event_type  VARCHAR  -- file.uploaded | file.downloaded | file.deleted | file.restored
file_id     VARCHAR
bytes       BIGINT
created_at  TIMESTAMPTZ
```

**`usage_summaries`** — aggregated per user per period
```sql
user_id       VARCHAR
period_type   VARCHAR  -- daily | monthly
period_start  DATE
bytes_uploaded    BIGINT
bytes_downloaded  BIGINT
api_calls         BIGINT
file_count        INTEGER
storage_used      BIGINT
UNIQUE (user_id, period_type, period_start)
```

---

## Environment Variables

```env
PORT=5003
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_DB=metering_db

REDIS_HOST=redis
REDIS_PORT=6379

WORKER_CONCURRENCY=5
INTERNAL_SERVICE_SECRET=your-secret
LOG_LEVEL=info
NODE_ENV=development
```

---

## Start

```bash
npm install
npm run dev
```

## API Docs
http://localhost:5003/api/v1/metering/docs