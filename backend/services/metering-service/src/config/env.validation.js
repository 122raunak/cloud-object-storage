const requiredEnvVars = [
  "PORT",

  // PostgreSQL
  "POSTGRES_HOST",
  "POSTGRES_PORT",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_DB",

  // Redis
  "REDIS_HOST",
  "REDIS_PORT",

  // App
  "NODE_ENV",
]

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}

module.exports = { validateEnv }