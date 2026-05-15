# Auth Service

Handles all authentication, authorization, and user management for CloudStore.

---

## Features

- User registration with password strength validation
- Login with JWT access + refresh token pair
- Refresh token rotation — each refresh invalidates the old token
- httpOnly cookie-based session — access token never stored in localStorage
- Role-based access control (USER / ADMIN)
- Suspended user login blocked with 403
- Notification preferences auto-created on registration
- Login alert fired to Notification Service on every successful login

---

## Token Strategy

| Token | Storage | Expiry | Purpose |
|---|---|---|---|
| Access Token | Memory (in-app) | 15 minutes | API authorization |
| Refresh Token | httpOnly Cookie | 7 days | Silent session renewal |

Refresh tokens are hashed with SHA-256 before storage — raw token never persists in DB.

---

## Password Rules

- Minimum 8 characters, maximum 72
- Must contain at least one uppercase letter
- Must contain at least one number
- Must contain at least one special character (`!@#$%^&*`)

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login and receive tokens |
| POST | `/api/auth/logout` | Required | Logout and clear cookies |
| POST | `/api/auth/refresh-token` | Cookie | Refresh access token |
| GET | `/api/auth/me` | Required | Get current user |
| PATCH | `/api/auth/change-password` | Required | Change own password |
| GET | `/api/auth/all-users` | Admin | List all users (paginated) |
| PATCH | `/api/auth/change-role/:userId` | Admin | Change user role |
| PATCH | `/api/auth/suspend/:userId` | Admin | Suspend user with reason |
| PATCH | `/api/auth/unsuspend/:userId` | Admin | Unsuspend user |
| DELETE | `/api/auth/delete-user/:userId` | Admin | Permanently delete user |

---

## Environment Variables

```env
PORT=5001
MONGODB_URI=mongodb+srv://...

JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

CORS_ORIGIN=http://localhost:3000
NOTIFICATION_SERVICE_URL=http://notification-service:5005
INTERNAL_SERVICE_SECRET=your-secret

RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=20
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
http://localhost:5001/api/v1/auth/docs
```