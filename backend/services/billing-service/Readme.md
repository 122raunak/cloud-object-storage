# Billing Service

Handles pricing tiers, usage-based charge calculation, and monthly invoice generation.

---

## Features

- Three pricing tiers with configurable free allowances
- Exact decimal arithmetic for all money calculations (decimal.js — no IEEE 754 float errors)
- Atomic invoice generation with idempotency — concurrent requests never create duplicates
- Monthly invoice auto-generation via cron (1st of month, 00:30 UTC)
- Parallel invoice generation with p-limit (concurrency=10) — handles large user bases efficiently
- Retry logic on all metering HTTP calls (3 retries with exponential backoff)
- Invoice.generated event published to BullMQ on creation
- Admin can manually generate invoices for any user for past months

---

## Pricing Tiers

| Plan | Storage | Upload | Download | API Calls | Free Storage | Free Upload | Free Download | Free API Calls |
|---|---|---|---|---|---|---|---|---|
| Free | $0.023/GB | $0.005/GB | $0.090/GB | $0.0004/1000 | 5 GB | 1 GB | 1 GB | 1,000 |
| Standard | $0.023/GB | $0.008/GB | $0.090/GB | $0.0004/1000 | 0 GB | 0 GB | 0 GB | 0 |
| Enterprise | $0.018/GB | $0.006/GB | $0.070/GB | $0.0003/1000 | 0 GB | 0 GB | 0 GB | 0 |

---

## Charge Calculation
```
storageCharge  = MAX(0, storage_used_GB   - free_storage_gb)   × storage_price
uploadCharge   = MAX(0, bytes_uploaded_GB  - free_upload_gb)    × upload_price
downloadCharge = MAX(0, bytes_downloaded_GB - free_download_gb) × download_price
apiCharge      = MAX(0, api_calls - free_api_calls) / 1000      × api_call_price
totalAmount = storageCharge + uploadCharge + downloadCharge + apiCharge
```
All values computed with decimal.js to 8 decimal places for precision on small amounts.

---

## Invoice Generation Flow
```
Cron triggers on 1st of month at 00:30 UTC
│
▼
Fetch all users from user_plans UNION invoices
│
▼
For each user (parallel, concurrency=10):
│
▼
Fetch monthly usage from Metering Service (3 retries, exponential backoff)
│
▼
Calculate charges using pricing tier (decimal.js)
│
▼
INSERT INTO invoices ON CONFLICT DO NOTHING (atomic — no race condition)
│
▼
Publish invoice.generated to BullMQ
│
▼
Notification Service sends invoice email
```
---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/billing/plans` | Public | List all pricing tiers |
| PUT | `/api/billing/plans/:userId` | Admin | Assign plan to user |
| GET | `/api/billing/current/:userId` | Owner or Admin | Current month estimate |
| GET | `/api/billing/invoices/:userId` | Owner or Admin | List invoices (paginated) |
| GET | `/api/billing/invoices/:userId/:invoiceId` | Owner or Admin | Get single invoice |
| POST | `/api/billing/generate/:userId` | Admin | Manually generate invoice (past months only) |

---

## Database Schema

**`pricing_tiers`**
```sql
id               BIGSERIAL PRIMARY KEY
name             VARCHAR(100) UNIQUE
storage_price    NUMERIC(10,6)
upload_price     NUMERIC(10,6)
download_price   NUMERIC(10,6)
api_call_price   NUMERIC(10,6)
free_storage_gb  INTEGER
free_upload_gb   INTEGER
free_download_gb INTEGER
free_api_calls   INTEGER
```

**`user_plans`**
```sql
user_id    VARCHAR(255) UNIQUE
tier_id    BIGINT REFERENCES pricing_tiers(id)
started_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**`invoices`**
```sql
user_id          VARCHAR(255)
period_start     DATE
period_end       DATE
bytes_uploaded   BIGINT
bytes_downloaded BIGINT
api_calls        BIGINT
storage_used     BIGINT
storage_charge   NUMERIC(12,8)
upload_charge    NUMERIC(12,8)
download_charge  NUMERIC(12,8)
api_charge       NUMERIC(12,8)
total_amount     NUMERIC(12,8)
currency         VARCHAR(3)
status           VARCHAR(20)  -- draft | issued | paid | void
issued_at        TIMESTAMPTZ
UNIQUE (user_id, period_start)
```

---

## Environment Variables

**Local (`.env`):**
```env
PORT=5004
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_DB=billing_db
REDIS_HOST=redis
REDIS_PORT=6379
METERING_SERVICE_URL=http://metering-service:5003
INTERNAL_SERVICE_SECRET=your-secret
LOG_LEVEL=info
NODE_ENV=development
```

**Production (Render):**
```env
PORT=5004
POSTGRES_HOST=your-neon-host.neon.tech
POSTGRES_PORT=5432
POSTGRES_USER=neondb_owner
POSTGRES_PASSWORD=your-neon-password
POSTGRES_DB=billing_db
REDIS_HOST=your-upstash-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-password
METERING_SERVICE_URL=https://cloudstore-metering.onrender.com
INTERNAL_SERVICE_SECRET=your-secret
LOG_LEVEL=info
NODE_ENV=production
```

**Note:** Neon PostgreSQL requires SSL — the service automatically enables SSL when `NODE_ENV=production`.

---

## Start

```bash
npm install
npm run dev
```

## API Docs
http://localhost:5004/api/v1/billing/docs