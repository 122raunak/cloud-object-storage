# Storage Service

Handles file upload, download, and management using presigned URLs for direct object storage access.

---

## Features

- Presigned URL generation for direct MinIO/Cloudflare R2 uploads — files bypass the gateway
- File metadata stored in MongoDB
- Soft delete — files moved to trash, not permanently removed
- Restore deleted files
- Storage quota enforcement per user (default 5GB)
- File type and extension validation
- Idempotent uploads via idempotency key header
- Events published to two BullMQ queues on every file operation

---

## Upload Flow
1. POST /api/storage/upload-url
→ Validates file type, size, quota
→ Generates presigned URL + objectKey from MinIO/R2
→ Returns { uploadUrl, objectKey }
2. PUT {uploadUrl}  (client uploads directly to MinIO/R2)
→ Bypasses API Gateway entirely
→ No size limit from Node.js
3. POST /api/storage/confirm-upload
→ Verifies file exists in object storage
→ Validates size matches declared size
→ Creates file record in MongoDB
→ Publishes file.uploaded to BullMQ queues

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
| GET | `/api/storage/files` | List files (supports search, filter, sort, pagination, includeDeleted) |
| GET | `/api/storage/download-url/:fileId` | Generate presigned download URL |
| DELETE | `/api/storage/:fileId` | Soft delete file (moves to trash) |
| PATCH | `/api/storage/restore/:fileId` | Restore file from trash |

---

## File Constraints

| Setting | Value |
|---|---|
| Max file size | 10 MB |
| Allowed types | image/png, image/jpeg, application/pdf |
| Allowed extensions | jpg, jpeg, png, pdf, mp4, docx |
| Storage quota | 5 GB per user |

---

## Environment Variables

```env
PORT=5002
STORAGE_MONGO_URI=mongodb+srv://...

MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=uploads
MINIO_USE_SSL=false
MINIO_PUBLIC_ENDPOINT=localhost
MINIO_PUBLIC_PORT=9000

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

---

## Start

```bash
npm install
npm run dev
```

## API Docs
http://localhost:5002/api/v1/storage/docs