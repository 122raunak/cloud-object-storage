const requiredEnvVars = [
  "STORAGE_MONGO_URI",
  "MINIO_ENDPOINT",
  "MINIO_PORT",
  "MINIO_ACCESS_KEY",
  "MINIO_SECRET_KEY",
  "MINIO_BUCKET",
  "ALLOWED_FILE_TYPES",
  "ALLOWED_EXTENSIONS",
  "MAX_FILE_SIZE",
  "PRESIGNED_URL_EXPIRY",
  "STORAGE_SERVICE_PORT",
  "REDIS_HOST",
  "REDIS_PORT"
]

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`)
    process.exit(1)
  }
}

module.exports = validateEnv