# CloudStore Backend

Microservices backend for the CloudStore platform.

## Services
backend/
├── services/
│   ├── api-gateway/          # Entry point, JWT verification, rate limiting
│   ├── auth-service/         # Authentication, user management
│   ├── billing-service/      # Pricing tiers, invoices, estimates
│   ├── metering-service/     # Usage tracking and aggregation
│   ├── notification-service/ # Email notifications, BullMQ workers
│   └── storage-service/      # File upload/download, MinIO/R2
├── docker-compose.yml
├── .env                      # Single env file for local development
└── .env.example

## Local Development

```bash
# From backend directory
docker compose up -d

# View logs for a specific service
docker logs auth-service --tail 20 -f

# Restart a service after code changes
docker compose restart auth-service
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.

For production, each service has its own `.env` file.

## Queue Architecture

Events flow through two separate BullMQ queues:
- `storage-events-metering` — consumed by metering service only
- `storage-events-notification` — consumed by notification service only

This ensures both services receive every storage event independently.