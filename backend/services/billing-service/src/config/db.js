const { Pool } = require("pg")
const logger   = require("../utils/logger")

const pool = new Pool({
  host:                    process.env.POSTGRES_HOST,
  port:                    parseInt(process.env.POSTGRES_PORT, 10),
  user:                    process.env.POSTGRES_USER,
  password:                process.env.POSTGRES_PASSWORD,
  database:                process.env.POSTGRES_DB,
  max:                     20,
  idleTimeoutMillis:       30000,
  connectionTimeoutMillis: 2000,
})

pool.on("connect", () => logger.info("PostgreSQL client connected"))
pool.on("error",   (err) => logger.error({ err }, "PostgreSQL connection error"))

const initDB = async () => {
  const client = await pool.connect()

  try {
    // ── pricing_tiers ──────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS pricing_tiers (
        id               BIGSERIAL PRIMARY KEY,
        name             VARCHAR(100) NOT NULL,
        storage_price    NUMERIC(10,6) NOT NULL,
        upload_price     NUMERIC(10,6) NOT NULL,
        download_price   NUMERIC(10,6) NOT NULL,
        api_call_price   NUMERIC(10,6) NOT NULL,
        free_storage_gb  INTEGER NOT NULL DEFAULT 5,
        free_upload_gb   INTEGER NOT NULL DEFAULT 1,
        free_download_gb INTEGER NOT NULL DEFAULT 1,
        free_api_calls   INTEGER NOT NULL DEFAULT 1000,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    // ── add unique constraint on name if not exists ────────────────────────
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'pricing_tiers_name_unique'
        ) THEN
          ALTER TABLE pricing_tiers 
          ADD CONSTRAINT pricing_tiers_name_unique UNIQUE (name);
        END IF;
      END $$;
    `)

    // ── clean up duplicate plans keeping lowest id per name ────────────────
    await client.query(`
      DELETE FROM pricing_tiers
      WHERE id NOT IN (
        SELECT MIN(id) FROM pricing_tiers GROUP BY name
      )
    `)

    // ── user_plans ─────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_plans (
        id         BIGSERIAL PRIMARY KEY,
        user_id    VARCHAR(255) UNIQUE NOT NULL,
        tier_id    BIGINT NOT NULL REFERENCES pricing_tiers(id),
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    // ── invoices ───────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id               BIGSERIAL PRIMARY KEY,
        user_id          VARCHAR(255) NOT NULL,
        period_start     DATE NOT NULL,
        period_end       DATE NOT NULL,
        bytes_uploaded   BIGINT NOT NULL DEFAULT 0,
        bytes_downloaded BIGINT NOT NULL DEFAULT 0,
        api_calls        BIGINT NOT NULL DEFAULT 0,
        storage_used     BIGINT NOT NULL DEFAULT 0,
        storage_charge   NUMERIC(12,4) NOT NULL DEFAULT 0,
        upload_charge    NUMERIC(12,4) NOT NULL DEFAULT 0,
        download_charge  NUMERIC(12,4) NOT NULL DEFAULT 0,
        api_charge       NUMERIC(12,4) NOT NULL DEFAULT 0,
        total_amount     NUMERIC(12,4) NOT NULL DEFAULT 0,
        currency         VARCHAR(3)  NOT NULL DEFAULT 'USD',
        status           VARCHAR(20) NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft', 'issued', 'paid', 'void')),
        issued_at        TIMESTAMPTZ,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, period_start)
      )
    `)

    // ── indexes ────────────────────────────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_user_id
        ON invoices (user_id)
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_status
        ON invoices (status)
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_user_period
        ON invoices (user_id, period_start DESC)
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_period_start
        ON invoices USING BRIN (period_start)
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_plans_user_id
        ON user_plans (user_id)
    `)

    // ── seed pricing tiers ─────────────────────────────────────────────────
    await client.query(`
      INSERT INTO pricing_tiers
        (name, storage_price, upload_price, download_price, api_call_price,
         free_storage_gb, free_upload_gb, free_download_gb, free_api_calls)
      VALUES
        ('Free',       0.023000, 0.005000, 0.090000, 0.000400, 5, 1, 1, 1000),
        ('Standard',   0.023000, 0.008000, 0.090000, 0.000400, 0, 0, 0,    0),
        ('Enterprise', 0.018000, 0.006000, 0.070000, 0.000300, 0, 0, 0,    0)
      ON CONFLICT (name) DO NOTHING
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