# CloudStore — Cloud Object Storage Platform

A production-grade cloud object storage platform built with microservices architecture. Upload, manage, and share files with enterprise-grade features including usage-based billing, metering, and email notifications.

---

## Overview

CloudStore is a fully containerized microservices application that provides:

- **Secure file storage** via presigned URLs directly to object storage
- **Usage-based billing** with Free, Standard, and Enterprise plans
- **Real-time metering** of storage, uploads, downloads, and API calls
- **Email notifications** for login alerts, invoices, daily digests, and weekly reports
- **Admin panel** for user management, role assignment, and plan control

Everything runs in Docker containers locally, and deploys to cloud platforms (Render, Vercel, Upstash, Supabase, Cloudflare R2) in production.

---


## Architecture


```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│                          (Vercel)                               │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────▼───────────────────────────────────┐
│                         API Gateway                             │
│              JWT Auth · Rate Limiting · Routing                 │
└──────┬───────────┬──────────┬──────────┬────────────┬───────────┘
       │           │          │          │            │
┌──────▼───┐ ┌────▼─────┐ ┌──▼──────┐ ┌─▼────────┐ ┌▼───────────┐
│   Auth   │ │ Storage  │ │Metering │ │ Billing  │ │Notification│
│ Service  │ │ Service  │ │ Service │ │ Service  │ │  Service   │
│  :5001   │ │  :5002   │ │  :5003  │ │  :5004   │ │   :5005    │
└──────┬───┘ └────┬─────┘ └──┬──────┘ └─┬────────┘ └┬───────────┘
       │          │    │      │          │           │
       │          │  Events (BullMQ)     │           │
       │          │ ┌──┴──────────────┐  │           │
       │          │ │storage-events-  │  │           │
       │          │ │metering         ├──┘           │
       │          │ │storage-events-  │              │
       │          │ │notification     ├──────────────┘
       │          │ └─────────────────┘
       │          │
┌──────▼───┐ ┌────▼─────┐ ┌─────────────┐ ┌──────────────────────┐
│ MongoDB  │ │ MinIO /  │ │ PostgreSQL  │ │       Redis          │
│  Atlas   │ │    R2    │ │ metering_db │ │  (BullMQ + Cache)    │
│ auth_db  │ │ (files)  │ │ billing_db  │ │                      │
│notif_db  │ │          │ │             │ │                      │
│storage_db│ │          │ │             │ │                      │
└──────────┘ └──────────┘ └─────────────┘ └──────────────────────┘
```
## Flow

> Client → **API Gateway** → **Microservices** → **MongoDB / PostgreSQL / R2**
>
> File uploads → **Storage Service** → **Presigned URL** → **Cloudflare R2** (direct, bypasses gateway)
>
> Storage events → **BullMQ** → **Metering Service** + **Notification Service** (parallel, independent queues)

---

## Microservices Overview

| Service | Port | Responsibility |
|---|---|---|
| **API Gateway** | 5000 | Single entry point. JWT verification, rate limiting, proxying, circuit breaker |
| **Auth Service** | 5001 | Registration, login, JWT tokens, refresh token rotation, user management |
| **Storage Service** | 5002 | Presigned URL generation, file metadata, soft delete, restore, quota enforcement |
| **Metering Service** | 5003 | Usage event consumption, daily/monthly aggregation, usage API |
| **Billing Service** | 5004 | Pricing tiers, usage-based charges, invoice auto-generation |
| **Notification Service** | 5005 | Email alerts, login notifications, daily digest, weekly reports |

---

## Project Structure
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
---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Axios |
| API Gateway | Node.js, Express, http-proxy-middleware, Opossum (circuit breaker) |
| Auth | Node.js, Express, MongoDB, bcrypt, JWT, Redis |
| Storage | Node.js, Express, MongoDB, MinIO SDK / Cloudflare R2 |
| Metering | Node.js, Express, PostgreSQL, BullMQ |
| Billing | Node.js, Express, PostgreSQL, node-cron |
| Notifications | Node.js, Express, MongoDB, BullMQ, Nodemailer, Resend |
| Infrastructure | Docker, Docker Compose, Redis, MinIO |

---

## Quick Start (Local)

### Prerequisites
- Docker and Docker Compose installed
- Node.js 20+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/cloudstore.git
cd cloudstore
```

### 2. Set Up Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB Atlas URI, JWT secrets, etc.
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
- MinIO

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
- Upload files (PDF, images, videos) up to 10MB
- Download, delete, and restore files (soft delete with trash)
- View storage usage, API calls, and billing estimates
- Manage notification preferences (email alerts, digests)
- View invoices and billing history

### Admin Features
- View all registered users with usage and billing data
- Change user roles (USER / ADMIN)
- Assign billing plans to users
- Suspend / unsuspend users with reason
- Delete user accounts
- System-wide statistics

### Billing
| Plan | Free Storage | Free Upload | Free Download | Free API Calls |
|---|---|---|---|---|
| Free | 5 GB | 1 GB | 1 GB | 1,000 |
| Standard | 0 GB | 0 GB | 0 GB | 0 |
| Enterprise | 0 GB | 0 GB | 0 GB | 0 |

Invoices auto-generate on the 1st of each month at 00:30 UTC.

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
Storage Service
│
├──► storage-events-metering      ──► Metering Service
│
└──► storage-events-notification  ──► Notification Service
Each queue has:
- 5 retry attempts with exponential backoff
- Failed jobs retained for 7 days (dead letter queue)
- Completed jobs retained for 24 hours

---

## Deployment

| Component | Platform |
|---|---|
| Frontend | Vercel |
| All backend services | Render (individual web services) |
| MongoDB | Atlas |
| PostgreSQL | Supabase |
| Redis | Upstash |
| Object Storage | Cloudflare R2 |

See individual service READMEs for service-specific deployment instructions.

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

For production, each service uses its own `.env` file with only the variables it needs. See each service's README for the required variables.