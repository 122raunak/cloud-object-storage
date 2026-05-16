# CloudStore — Cloud Object Storage Platform

A production-grade cloud object storage platform built with microservices architecture. Upload, manage, and share files with enterprise-grade features including usage-based billing, metering, and email notifications.

---

## Live Demo

| Component | URL |
|---|---|
| Frontend | https://cloud-object-storage.vercel.app |
| API Gateway | https://cloudstore-gateway.onrender.com |

---

## Overview

CloudStore is a fully containerized microservices application that provides:

- **Secure file storage** via presigned URLs directly to object storage
- **File sharing** with expiry links — share files with anyone without requiring login
- **Usage-based billing** with Free, Standard, and Enterprise plans
- **Real-time metering** of storage, uploads, downloads, and API calls
- **Email notifications** for login alerts, invoices, daily digests, and weekly reports
- **Admin panel** for user management, role assignment, and plan control
- **Analytics charts** — visual storage and transfer usage over time

Everything runs in Docker containers locally, and deploys to cloud platforms in production.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│                    Vite · React Router · Axios                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────▼───────────────────────────────────┐
│                         API Gateway                             │
│         JWT Verification · Rate Limiting · Proxying             │
│              Circuit Breaker · CORS · Request ID                │
└──────┬───────────┬──────────┬──────────┬────────────┬───────────┘
       │           │          │          │            │
┌──────▼───┐ ┌────▼─────┐ ┌──▼──────┐ ┌─▼────────┐ ┌▼───────────┐
│   Auth   │ │ Storage  │ │Metering │ │ Billing  │ │Notification│
│ Service  │ │ Service  │ │ Service │ │ Service  │ │  Service   │
│  :5001   │ │  :5002   │ │  :5003  │ │  :5004   │ │   :5005    │
└──────┬───┘ └────┬─────┘ └──┬──────┘ └─┬────────┘ └┬───────────┘
       │          │          │          │             │
       │          │      ┌────▼──────────▼──┐         │
       │          │      │   BullMQ Queues  │         │
       │          │      │ storage-events-  │         │
       │          │      │   metering       |         │
       │          │      │ storage-events-  |         │
       │          │      │   notification   |─────────┘
       │          │      └──────────────────┘
       │          │
┌──────▼───┐ ┌────▼─────┐ ┌─────────────┐ ┌──────────────────────┐
│ MongoDB  │ │ Supabase │ │ PostgreSQL  │ │       Redis          │
│  Atlas   │ │ Storage  │ │   (Neon)    │ │  BullMQ + API Cache  │
│ auth_db  │ │ (files)  │ │ metering_db │ │     (Upstash)        │
│notif_db  │ │          │ │ billing_db  │ │                      │
│storage_db│ │          │ │             │ │                      │
└──────────┘ └──────────┘ └─────────────┘ └──────────────────────┘
```
## Flow

> Client → **API Gateway** → **Microservices** → **MongoDB / PostgreSQL / Supabase Storage**
>
> File uploads → **Storage Service** → **Presigned URL** → **Supabase Storage** (direct, bypasses gateway)
>
> Storage events → **BullMQ** → **Metering Service** + **Notification Service** (parallel, independent queues)

---

## Microservices Overview

| Service | Port | Responsibility |
|---|---|---|
| **API Gateway** | 5000 | Single entry point. JWT verification, rate limiting, proxying, circuit breaker |
| **Auth Service** | 5001 | Registration, login, JWT tokens, refresh token rotation, user management |
| **Storage Service** | 5002 | Presigned URL generation, file metadata, soft delete, restore, quota enforcement, file sharing |
| **Metering Service** | 5003 | Usage event consumption, daily/monthly aggregation, usage API |
| **Billing Service** | 5004 | Pricing tiers, usage-based charges, invoice auto-generation |
| **Notification Service** | 5005 | Email alerts, login notifications, daily digest, weekly reports |

---

## Project Structure
```
cloud-object-storage/
│
├── backend/
│   ├── services/
│   │   ├── api-gateway/          # Entry point for all requests
│   │   ├── auth-service/         # Authentication and user management
│   │   ├── billing-service/      # Pricing, invoices, estimates
│   │   ├── metering-service/     # Usage tracking and aggregation
│   │   ├── notification-service/ # Email notifications and alerts
│   │   └── storage-service/      # File upload, download, management
│   │
│   ├── infrastructure/           # Config for Redis, PostgreSQL, MinIO
│   ├── docker-compose.yml        # Local development orchestration
│   ├── .env                      # Shared environment variables (local)
│   └── .env.example              # Environment template
│
└── frontend/
├── src/
│   ├── api/                  # Axios instances per service
│   ├── components/           # Shared UI components
│   ├── context/              # AuthContext with global state
│   ├── hooks/                # useFiles, useNotifications, etc.
│   ├── pages/                # Dashboard, Files, Billing, Admin, etc.
│   └── utils/                # formatBytes, formatDate, formatCurrency
├── index.html
└── vite.config.js
```
---

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Axios, Recharts |
| API Gateway | Node.js, Express, http-proxy-middleware, Opossum (circuit breaker) |
| Auth | Node.js, Express, MongoDB, bcrypt, JWT, Redis |
| Storage | Node.js, Express, MongoDB, AWS SDK S3 (Supabase Storage) |
| Metering | Node.js, Express, PostgreSQL (Neon), BullMQ |
| Billing | Node.js, Express, PostgreSQL (Neon), node-cron, decimal.js |
| Notifications | Node.js, Express, MongoDB, BullMQ, Resend |
| Infrastructure | Docker, Docker Compose, Redis (Upstash), MinIO (local) |

---

## Quick Start (Local)

### Prerequisites
- Docker and Docker Compose installed
- Node.js 20+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/122raunak/cloud-object-storage.git
cd cloud-object-storage
```

### 2. Set Up Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

### 3. Start All Services
```bash
docker compose up -d
```

This starts:
- All 6 backend microservices
- PostgreSQL
- MongoDB (local)
- Redis
- MinIO (local object storage)

### 4. Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```

### 5. Access the Application

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:5000 |
| API Docs | http://localhost:5000/docs |
| MinIO Console | http://localhost:9001 |

---

## Features

### User Features
- Register and login with secure JWT authentication
- Upload files (PDF, images, videos, documents) up to 10MB
- Download, delete, and restore files (soft delete with trash)
- **Bulk delete** — select multiple files and delete at once
- **File sharing** — generate shareable links with 1 hour expiry
- View storage usage, API calls, and billing estimates
- **Analytics charts** — daily and monthly storage, transfer, and API usage charts
- Manage notification preferences (email alerts, digests)
- View invoices and billing history
- Change password

### Admin Features
- View all registered users with usage and billing data
- Search and filter users by username or email
- Change user roles (USER / ADMIN)
- Assign billing plans to users
- Suspend / unsuspend users with reason
- Delete user accounts
- Generate invoices for any user for past months
- System-wide statistics (total users, admins, suspended)

### Billing
| Plan | Free Storage | Free Upload | Free Download | Free API Calls |
|---|---|---|---|---|
| Free | 5 GB | 1 GB | 1 GB | 1,000 |
| Standard | 0 GB | 0 GB | 0 GB | 0 |
| Enterprise | 0 GB | 0 GB | 0 GB | 0 |

Invoices auto-generate on the 1st of each month at 00:30 UTC.
All billing calculations use decimal.js for exact precision — no IEEE 754 float errors.

### Notifications
| Type | Trigger |
|---|---|
| Login Alert | Every successful login |
| Invoice Generated | Monthly invoice creation |
| Daily Digest | 08:00 UTC daily (if activity exists) |
| Weekly Report | Monday 09:00 UTC |
| Budget Alert | Spending exceeds threshold |
| Storage Warning | Usage exceeds 80% of quota |

---

## API Documentation

Each service exposes Swagger docs:

| Service | Docs URL |
|---|---|
| API Gateway | http://localhost:5000/docs |
| Auth Service | http://localhost:5001/api/v1/auth/docs |
| Storage Service | http://localhost:5002/api/v1/storage/docs |
| Metering Service | http://localhost:5003/api/v1/metering/docs |
| Billing Service | http://localhost:5004/api/v1/billing/docs |
| Notification Service | http://localhost:5005/api/v1/notifications/docs |

---

## Queue Architecture
Storage events are published to two separate BullMQ queues to ensure both consumers receive every event independently:
```
Storage Service
│
├──► storage-events-metering      ──► Metering Service
│
└──► storage-events-notification  ──► Notification Service
```
Each queue has:
- 5 retry attempts with exponential backoff
- Failed jobs retained for 7 days (dead letter queue)
- Completed jobs retained for 24 hours

---

Each queue has:
- 5 retry attempts with exponential backoff
- Failed jobs retained for 7 days (dead letter queue)
- Completed jobs retained for 24 hours

---

## Deployment

| Component | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploys on git push |
| All backend services | Render | Free tier — sleeps after 15min inactivity |
| MongoDB | Atlas | M0 free cluster |
| PostgreSQL | Neon | Free forever, serverless |
| Redis | Upstash | Free tier, TLS enabled |
| Object Storage | Supabase Storage | S3-compatible, free tier |
| Email | Resend | 3,000 emails/month free |
| Uptime Monitoring | UptimeRobot | Pings services every 5min to prevent sleep |

---

## Stopping Local Development

```bash
# Stop all containers
cd backend
docker compose down

# Stop and remove volumes (wipes local data)
docker compose down -v
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` for local development.

For production, each service uses its own `.env` file. See each service's README for required variables.

**Note:** Create `frontend/.env.local` for local development:
```env
VITE_API_URL=http://localhost:5000
```