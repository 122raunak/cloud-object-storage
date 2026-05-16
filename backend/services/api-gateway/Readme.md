# API Gateway

Single entry point for all CloudStore microservices. Every client request passes through here before reaching any service.

---

## Responsibilities

- **JWT Verification** — Validates access tokens by calling Auth Service, caches results in Redis (60s TTL)
- **Request Proxying** — Routes requests to the correct downstream service with path rewriting
- **Rate Limiting** — Global limit + per-route auth limit via environment variables
- **CORS** — Handles cross-origin requests and preflight, supports multiple allowed origins
- **Circuit Breaker** — Opossum circuit breaker on Auth Service calls — fails fast if auth is down
- **Request ID** — Injects `X-Request-ID` on every request for distributed tracing
- **Trust Proxy** — Correctly identifies client IPs behind Render's load balancer

---

## Route Mapping

| Gateway Path | Rewrites To | Target Service |
|---|---|---|
| `/api/auth/*` | `/api/v1/auth/*` | Auth Service :5001 |
| `/api/storage/*` | `/api/v1/storage/*` | Storage Service :5002 |
| `/api/metering/*` | `/api/v1/metering/*` | Metering Service :5003 |
| `/api/billing/*` | `/api/v1/billing/*` | Billing Service :5004 |
| `/api/notifications/*` | `/api/v1/notifications/*` | Notification Service :5005 |

---

## Auth Flow
```
Client Request
│
▼
Extract token from cookie or Authorization header
│
▼
Check Redis cache (token:${token})
│
Hit? ──► Inject x-user-id, x-user-role, x-user-email headers → Proxy
│
Miss?
│
▼
Call Auth Service /api/v1/auth/me via Circuit Breaker
│
▼
Cache user in Redis (60s TTL)
│
▼
Inject headers → Proxy to target service
```
---

## Rate Limiting

| Limiter | Applies To | Default |
|---|---|---|
| Global | All routes | 300 req / 15 min per IP |
| Auth Strict | `/api/auth/login`, `/api/auth/register` | 20 req / 15 min per IP |
| Auth API | All other `/api/auth/*` | 200 req / 15 min per IP |

All limits configurable via environment variables. Refresh token endpoint is always skipped.
Health check (`/health`) bypasses all rate limiters.

---

## Environment Variables

**Local (`.env`):**
```env
PORT=5000
CORS_ORIGIN=http://localhost:3000
AUTH_SERVICE_URL=http://auth-service:5001
STORAGE_SERVICE_URL=http://storage-service:5002
METERING_SERVICE_URL=http://metering-service:5003
BILLING_SERVICE_URL=http://billing-service:5004
NOTIFICATION_SERVICE_URL=http://notification-service:5005
REDIS_HOST=redis
REDIS_PORT=6379
RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_MAX=20
API_RATE_LIMIT_MAX=200
INTERNAL_SERVICE_SECRET=your-secret
LOG_LEVEL=info
NODE_ENV=development
```

**Production (Render):**
```env
PORT=5000
CORS_ORIGIN=https://your-app.vercel.app
AUTH_SERVICE_URL=https://cloudstore-auth.onrender.com
STORAGE_SERVICE_URL=https://cloudstore-storage.onrender.com
METERING_SERVICE_URL=https://cloudstore-metering.onrender.com
BILLING_SERVICE_URL=https://cloudstore-billing.onrender.com
NOTIFICATION_SERVICE_URL=https://cloudstore-notification.onrender.com
REDIS_HOST=your-upstash-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-password
RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_MAX=20
API_RATE_LIMIT_MAX=200
INTERNAL_SERVICE_SECRET=your-secret
LOG_LEVEL=info
NODE_ENV=production
```

---

## Start

```bash
npm install
npm run dev
```

## API Docs
http://localhost:5000/docs