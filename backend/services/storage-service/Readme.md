# Storage Service

Handles file upload, download, sharing, and management using presigned URLs for direct object storage access.

---

## Features

- Presigned URL generation for direct Supabase Storage uploads — files bypass the gateway
- File metadata stored in MongoDB
- Soft delete — files moved to trash, not permanently removed
- Restore deleted files
- **File sharing** — generate shareable presigned URLs with configurable expiry (max 24 hours)
- Storage quota enforcement per user (default 5GB)
- File type and extension validation
- Idempotent uploads via idempotency key header
- Events published to two BullMQ queues on every file operation
- Environment-aware storage — uses MinIO locally, AWS SDK + Supabase Storage in production
- **Folder management** — create folders, organize files, move files between folders
- **Move files** — reassign files to different folders without re-uploading

---

## Upload Flow
1. POST /api/storage/upload-url
→ Validates file type, size, quota
→ Generates presigned URL + objectKey
→ Returns { uploadUrl, objectKey }
2. PUT {uploadUrl}
→ Client uploads directly to Supabase Storage (bypasses gateway)
→ No size limit from Node.js
3. POST /api/storage/confirm-upload
→ Verifies file exists in object storage
→ Validates size matches declared size
→ Creates file record in MongoDB
→ Publishes file.uploaded to BullMQ queues
---

## Share Flow
1. GET /api/storage/share/:fileId?expiry=3600
→ Verifies file ownership
→ Generates presigned URL valid for expiry seconds (max 86400 = 24h)
→ Returns { shareUrl, fileName, size, expiresAt, expiresIn }
2. Anyone with the link can download the file
→ No authentication required
→ Link expires automatically after the specified time

---

## Events Published

Every file operation publishes to both queues simultaneously:

| Event | Trigger | Queues |
|---|---|---|
| `file.uploaded` | Confirmed upload | `storage-events-metering`, `storage-events-notification` |
| `file.downloaded` | Download URL generated | `storage-events-metering`, `storage-events-notification` |
| `file.deleted` | Soft delete | `storage-events-metering`, `storage-events-notification` |
| `file.restored` | File restored from trash | `storage-events-metering`, `storage-events-notification` |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/storage/upload-url` | Generate presigned upload URL |
| POST | `/api/storage/confirm-upload` | Confirm upload and register file |
| GET | `/api/storage/files` | List files (search, filter, sort, pagination, includeDeleted) |
| GET | `/api/storage/download-url/:fileId` | Generate presigned download URL |
| GET | `/api/storage/share/:fileId` | Generate shareable URL with expiry |
| DELETE | `/api/storage/:fileId` | Soft delete file (moves to trash) |
| PATCH | `/api/storage/restore/:fileId` | Restore file from trash |
| GET | `/api/storage/buckets` | List user folders |
| POST | `/api/storage/buckets` | Create a new folder |
| DELETE | `/api/storage/buckets/:bucketId` | Delete a folder |
| PATCH | `/api/storage/move/:fileId` | Move file to a different folder |

---

## File Constraints

| Setting | Value |
|---|---|
| Max file size | 10 MB |
| Allowed types | image/png, image/jpeg, application/pdf |
| Allowed extensions | jpg, jpeg, png, pdf, mp4, docx |
| Storage quota | 5 GB per user |
| Share link max expiry | 24 hours |

---

## Storage Backend

| Environment | Storage |
|---|---|
| Local (development) | MinIO (Docker container) |
| Production | Supabase Storage (S3-compatible) |

The service automatically switches between MinIO SDK (local) and AWS SDK (production) based on `NODE_ENV`.

---

## Environment Variables

**Local (`.env`):**
```env
PORT=5002
STORAGE_MONGO_URI=mongodb+srv://...
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=uploads
MINIO_USE_SSL=false
REDIS_HOST=redis
REDIS_PORT=6379
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/png,image/jpeg,application/pdf
ALLOWED_EXTENSIONS=jpg,jpeg,png,pdf,mp4,docx
PRESIGNED_URL_EXPIRY=300
USER_STORAGE_QUOTA=5368709120
INTERNAL_SERVICE_SECRET=your-secret
LOG_LEVEL=info
NODE_ENV=development
```

**Production (Render):**
```env
PORT=5002
STORAGE_MONGO_URI=mongodb+srv://...
MINIO_ENDPOINT=your-project.supabase.co
MINIO_PORT=443
MINIO_ACCESS_KEY=your-supabase-s3-access-key
MINIO_SECRET_KEY=your-supabase-s3-secret-key
MINIO_BUCKET=uploads
MINIO_USE_SSL=true
REDIS_HOST=your-upstash-host
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-password
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/png,image/jpeg,application/pdf
ALLOWED_EXTENSIONS=jpg,jpeg,png,pdf,mp4,docx
PRESIGNED_URL_EXPIRY=300
USER_STORAGE_QUOTA=5368709120
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
http://localhost:5002/api/v1/storage/docs