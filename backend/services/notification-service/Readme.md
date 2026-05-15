# Notification Service

Handles all email notifications and in-app notification storage for CloudStore.

---

## Features

- Consumes events from `storage-events-notification` and `billing-events` BullMQ queues
- Stores all notifications in MongoDB for in-app display
- Email delivery via Resend (SMTP)
- Per-user notification preferences (enable/disable each type)
- Login alert endpoint secured with internal service secret — not user JWT
- Daily digest and weekly report via cron jobs
- Failed jobs retained 7 days (acts as dead letter queue)

---

## Notification Types

| Type | Trigger | Channel |
|---|---|---|
| `login_alert` | Every successful login | Email + In-app |
| `invoice_generated` | Monthly invoice created | Email + In-app |
| `daily_digest` | 08:00 UTC daily (if activity > 0) | Email + In-app |
| `weekly_report` | Monday 09:00 UTC | Email + In-app |
| `budget_alert` | Spending exceeds threshold | Email + In-app |
| `storage_warning` | Storage usage > 80% of quota | Email + In-app |

---

## Queue Workers

| Queue | Events Handled |
|---|---|
| `storage-events-notification` | file.uploaded, file.downloaded, file.deleted, file.restored |
| `billing-events` | invoice.generated |
| `auth-events` | login.alert |

---

## Cron Jobs

| Job | Schedule | Description |
|---|---|---|
| Daily Digest | `0 8 * * *` | Sends activity summary — skipped if no activity that day |
| Weekly Report | `0 9 * * 1` | Sends weekly usage report every Monday |

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/notifications/login-alert` | Internal Secret | Trigger login alert (Auth Service only) |
| GET | `/api/notifications/:userId` | Owner or Admin | List notifications (filter by type/status) |
| GET | `/api/notifications/:userId/unread-count` | Owner or Admin | Get unread notification count |
| GET | `/api/notifications/:userId/preferences` | Owner or Admin | Get notification preferences |
| PUT | `/api/notifications/:userId/preferences` | Owner or Admin | Update notification preferences |

---

## Notification Preferences Schema

```json
{
  "email": "user@example.com",
  "budgetThreshold": 10.00,
  "storageQuotaGB": 5,
  "preferences": {
    "invoiceGenerated": true,
    "budgetAlert": true,
    "storageWarning": true,
    "loginAlert": true,
    "dailyDigest": true,
    "weeklyReport": true
  }
}
```

---

## Environment Variables

```env
PORT=5005
MONGODB_URI=mongodb+srv://...

REDIS_HOST=redis
REDIS_PORT=6379

SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=your-resend-api-key
EMAIL_FROM=CloudStore <onboarding@resend.dev>

USER_STORAGE_QUOTA_GB=5
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
```
http://localhost:5005/api/v1/notifications/docs
```