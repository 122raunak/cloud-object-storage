const { Pool } = require("pg")
const logger = require("../utils/logger")

const pool = new Pool({
  host:                   process.env.POSTGRES_HOST,
  port:                   parseInt(process.env.POSTGRES_PORT, 10),
  user:                   process.env.POSTGRES_USER,
  password:               process.env.POSTGRES_PASSWORD,
  database:               process.env.POSTGRES_DB,
  max:                    20,           
  idleTimeoutMillis:      30000,
  connectionTimeoutMillis: 2000,
})

pool.on("connect", () => logger.info("PostgreSQL client connected"))
pool.on("error",  (err) => logger.error({ err }, "PostgreSQL connection error"))

const initDB = async () => {
  const client = await pool.connect()

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS usage_events (
        id          BIGSERIAL PRIMARY KEY,
        event_id    VARCHAR(255) UNIQUE NOT NULL,
        user_id     VARCHAR(255) NOT NULL,
        event_type  VARCHAR(50)  NOT NULL CHECK (
                      event_type IN ('file.uploaded', 'file.downloaded', 'file.deleted', 'file.restored')
                    ),
        file_id     VARCHAR(255),
        file_name   VARCHAR(255),
        bytes       BIGINT       NOT NULL DEFAULT 0,
        mime_type   VARCHAR(100),
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usage_events_user_id
        ON usage_events (user_id)
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usage_events_event_type
        ON usage_events (event_type)
    `)

    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usage_events_created_at
        ON usage_events USING BRIN (created_at)
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usage_events_user_created
        ON usage_events (user_id, created_at DESC)
    `)

   
    await client.query(`
      CREATE TABLE IF NOT EXISTS usage_summaries (
        id                BIGSERIAL PRIMARY KEY,
        user_id           VARCHAR(255) NOT NULL,
        period_type       VARCHAR(10)  NOT NULL CHECK (period_type IN ('daily', 'monthly')),
        period_start      DATE         NOT NULL,
        bytes_uploaded    BIGINT       NOT NULL DEFAULT 0,
        bytes_downloaded  BIGINT       NOT NULL DEFAULT 0,
        api_calls         BIGINT       NOT NULL DEFAULT 0,
        file_count        BIGINT       NOT NULL DEFAULT 0,
        storage_used      BIGINT       NOT NULL DEFAULT 0,
        created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, period_type, period_start)
      )
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usage_summaries_lookup
        ON usage_summaries (user_id, period_type, period_start)
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usage_summaries_user_period_desc
        ON usage_summaries (user_id, period_type, period_start DESC)
    `)

    logger.info("Database tables initialized")
  } catch (err) {
    logger.error({ err }, "Database initialization failed")
    throw err
  } finally {
    client.release()
  }
}

module.exports = { pool, initDB }