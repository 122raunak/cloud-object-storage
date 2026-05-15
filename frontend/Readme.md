# CloudStore — Cloud Object Storage Frontend

React 18 frontend for the CloudStore cloud storage platform.

## Stack

- **React 18** — UI framework
- **React Router v6** — client-side routing
- **Axios** — HTTP client with interceptors
- **Vite** — build tool and dev server

## Project Structure
src/
├── api/              # Axios instance + per-service API modules
│   ├── axios.js      # Central axios with Bearer token & refresh-token interceptor
│   ├── auth.api.js
│   ├── storage.api.js
│   ├── billing.api.js
│   ├── metering.api.js
│   └── notifications.api.js
├── components/
│   ├── Layout/       # Sidebar, Navbar, Layout wrapper
│   ├── common/       # LoadingSpinner, ErrorMessage, ProgressBar, Badge
│   └── modals/       # UploadModal (3-step presigned URL flow)
├── context/
│   └── AuthContext.jsx   # Auth state, login/logout, session restore
├── hooks/
│   ├── useAuth.js
│   ├── useFiles.js
│   ├── useBilling.js
│   └── useNotifications.js
├── pages/
│   ├── Login/        # /login
│   ├── Register/     # /register
│   ├── Dashboard/    # /dashboard
│   ├── Files/        # /files
│   ├── Billing/      # /billing
│   ├── Usage/        # /usage
│   ├── Notifications/# /notifications
│   ├── Settings/     # /settings
│   └── Admin/        # /admin (admin only)
├── utils/
│   ├── formatBytes.js
│   ├── formatDate.js
│   └── formatCurrency.js
├── App.jsx           # Router + auth guards
├── main.jsx
└── index.css         # Full design system (CSS variables, components)

## Setup

```bash
npm install
npm run dev       # http://localhost:3000
npm run build
```

## Auth Flow

- Access token stored **in memory only** (not localStorage)
- On app load, calls `POST /api/auth/refresh-token` to restore session via httpOnly cookie
- 401 responses automatically trigger token refresh, then retry original request
- On refresh failure, user is redirected to `/login`

## Upload Flow

1. `POST /api/storage/upload-url` → get presigned URL + objectKey
2. `PUT {uploadUrl}` directly to MinIO (not through gateway)
3. `POST /api/storage/confirm-upload` → register file in system

## Admin Features

- View all registered users with usage and billing data
- Change user roles (USER / ADMIN)
- Assign billing plans to users
- Suspend / unsuspend users
- Delete users
- System-wide statistics (total users, admins, suspended accounts)
- Search and filter users by username or email

## Design

Clean enterprise aesthetic: white base, professional blue accent (#2563eb), Inter font for UI, JetBrains Mono for data and code.