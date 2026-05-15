const { z } = require("zod")
const logger = require("../utils/logger")

const envSchema = z.object({
  PORT: z.string().default("5005"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  REDIS_HOST: z.string().default("redis"),
  REDIS_PORT: z.string().default("6379"),
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.string().default("465"),
  SMTP_USER: z.string().min(1, "SMTP_USER is required"),
  SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
  EMAIL_FROM: z.string().default("CloudStore <noreply@cloudstore.com>"),
  LOG_LEVEL: z.string().default("info"),
  CORS_ORIGIN: z.string().url("CORS_ORIGIN must be a valid URL").default("http://localhost:3000"),
  USER_STORAGE_QUOTA_GB: z.string().default("5"),
  INTERNAL_SERVICE_SECRET: z.string().min(32, "INTERNAL_SERVICE_SECRET must be at least 32 characters"),
})

function validateEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    logger.error(
      { errors: result.error.flatten().fieldErrors },
      "Invalid environment variables"
    )
    process.exit(1)
  }
  logger.info("Environment variables validated")
  return result.data
}

module.exports = { validateEnv }