# CloudStore — Cloud Object Storage Frontend

React 18 frontend for the CloudStore cloud storage platform.

---

## Live Demo
https://cloud-object-storage.vercel.app
---

## Stack

- **React 18** — UI framework
- **React Router v6** — client-side routing
- **Axios** — HTTP client with interceptors
- **Vite** — build tool and dev server
- **Recharts** — analytics charts for usage visualization

---

## Project Structure
```
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
│   └── AuthContext.jsx   # Auth state, login/logout, session restore, unread count polling
├── hooks/
│   ├── useAuth.js
│   ├── useFiles.js
│   ├── useBilling.js
│   └── useNotifications.js
├── pages/
│   ├── Login/        # /login
│   ├── Register/     # /register
│   ├── Dashboard/    # /dashboard — stats, recent files, notification counter
│   ├── Files/        # /files — upload, download, delete, restore, bulk delete, share
│   ├── Billing/      # /billing — invoices, current estimate
│   ├── Usage/        # /usage — analytics charts, daily/monthly breakdown
│   ├── Notifications/# /notifications — in-app notification list
│   ├── Settings/     # /settings — change password, notification preferences
│   └── Admin/        # /admin — user management (admin only)
├── utils/
│   ├── formatBytes.js
│   ├── formatDate.js
│   └── formatCurrency.js
├── App.jsx           # Router + auth guards
├── main.jsx
└── index.css         # Full design system (CSS variables, components)
```
---

## Setup

```bash
# Install dependencies
npm install

# Local development
npm run dev       # http://localhost:3000

# Production build
npm run build
```

### Local Environment

Create `frontend/.env.local` for local development:
```env
VITE_API_URL=http://localhost:5000
```

This overrides the production URL and is automatically gitignored.

---

## Auth Flow

- Access token stored **in memory only** (not localStorage)
- On app load, calls `POST /api/auth/refresh-token` to restore session via httpOnly cookie
- 401 responses automatically trigger token refresh, then retry original request
- On refresh failure, user is redirected to `/login`
- Unread notification count polled every 30 seconds via `AuthContext`

---

## Upload Flow
1. POST /api/storage/upload-url
→ validates file type, size, quota
→ returns presigned URL + objectKey
2. PUT {uploadUrl}
→ uploads directly to Supabase Storage (bypasses gateway)
3. POST /api/storage/confirm-upload
→ registers file in MongoDB
→ publishes file.uploaded event to BullMQ
---

## File Sharing Flow
1. GET /api/storage/share/:fileId?expiry=3600
→ generates presigned URL valid for 1 hour
→ returns shareUrl + expiresAt
3. User copies link and shares with anyone
→ recipient can download without logging in
→ link expires automatically after 1 hour

---

## Folder Management Flow
1. Create folder via `/buckets` page
2. Upload files with folder selected in dropdown
3. Move existing files to folders via Move button
4. Filter files by folder using the folder selector

---

## Features

### User Features
- Register and login with JWT authentication
- Upload files up to 10MB (PDF, images, videos, documents)
- Download, delete, and restore files (soft delete with trash)
- **Bulk delete** — select multiple files with checkboxes
- **File sharing** — shareable links with 1 hour expiry
- Upload files up to **500MB**
- **Folder management** — create folders, move files between folders
- **Payment gateway** — pay invoices with Razorpay
- **Landing page** — product marketing page at `/`
- **Read/unread notifications** — mark individual or all notifications as read
- Storage usage progress bar with accurate percentage
- **Analytics charts** — area chart, bar charts for storage/transfer/API usage
- Notification counter with 30-second polling
- View invoices and billing history
- Change password

### Admin Features
- View all registered users with usage and billing data
- Search and filter users by username or email
- Change user roles (USER / ADMIN)
- Assign billing plans (Free / Standard / Enterprise)
- Suspend / unsuspend users with reason
- Delete user accounts
- **Generate invoices** for any user for past months
- System-wide statistics

---

## Design

Clean enterprise aesthetic: white base, professional blue accent (`#2563eb`), Inter font for UI, JetBrains Mono for data and code. Fully responsive layout with sidebar navigation.