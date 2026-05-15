const { Worker } = require("bullmq")
const { z } = require("zod")
const notificationService = require("../services/notification.service")
const { QUEUE_NAMES } = require("../config/queue")
const { createRedisConnection } = require("../config/redis")
const logger = require("../utils/logger")

// ─── Event Schema Validation ───────────────────────────────────────────────────
// Validate every incoming event before touching it.
// A malformed event from a buggy publisher must never crash the worker.

const baseEventSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  eventType: z.string().min(1, "eventType is required"),
  data: z.object({
    userId: z.string().min(1, "data.userId is required"),
  }).passthrough(), // Allow extra fields per event type
})

const invoiceEventSchema = baseEventSchema.extend({
  data: z.object({
    userId: z.string().min(1),
    invoiceId: z.union([z.string(), z.number()]),
    periodStart: z.string(),
    periodEnd: z.string(),
    totalAmount: z.string(),
    currency: z.string().default("USD"),
    lineItems: z.array(z.any()).default([]),
  }),
})

const fileEventSchema = baseEventSchema.extend({
  data: z.object({
    userId: z.string().min(1),
    fileId: z.string().optional(),
    size: z.number().int().min(0).default(0),
    filename: z.string().optional(),
  }),
})

const EVENT_SCHEMAS = {
  "invoice.generated": invoiceEventSchema,
  "file.uploaded":     fileEventSchema,
  "file.downloaded":   fileEventSchema,
  "file.deleted":      fileEventSchema,
  "file.restored":     fileEventSchema,
}

// ─── Event Validation ──────────────────────────────────────────────────────────

function validateEvent(eventType, payload) {
  const schema = EVENT_SCHEMAS[eventType] || baseEventSchema
  const result = schema.safeParse(payload)
  if (!result.success) {
    logger.error(
      { eventType, errors: result.error.flatten().fieldErrors },
      "Event schema validation failed"
    )
    return null
  }
  return result.data
}

// ─── Event Dispatcher ──────────────────────────────────────────────────────────

async function dispatch(job) {
  // BullMQ job.data is already parsed — no JSON.parse needed
  const { eventType, eventId } = job.data

  logger.info(
    { jobId: job.id, eventType, eventId, userId: job.data?.data?.userId, attempt: job.attemptsMade + 1 },
    "Processing notification job"
  )

  const event = validateEvent(eventType, job.data)
  if (!event) {
    // Throw to trigger BullMQ retry — bad schema might be a transient publisher bug
    throw new Error(`Invalid event schema for eventType: ${eventType}`)
  }

  switch (eventType) {
    case "invoice.generated":
      await notificationService.handleInvoiceGenerated(event)
      break

    case "file.uploaded":
      // Track activity counters for digest jobs (parallel — both must complete)
      await Promise.all([
        notificationService.trackFileActivity(event.data.userId, eventType, event.data.size),
        notificationService.handleFileUploaded(event),
      ])
      break

    case "file.downloaded":
    case "file.deleted":
    case "file.restored":
      await notificationService.trackFileActivity(event.data.userId, eventType, 0)
      break

    default:
      // Log warning but DO NOT throw — unhandled event types should not be retried
      logger.warn({ eventType, jobId: job.id }, "Unhandled event type — discarding job")
  }
}

// ─── Workers ──────────────────────────────────────────────────────────────────
// Each queue gets its own Worker with a dedicated Redis connection.
// concurrency: how many jobs this worker processes in parallel.
// BullMQ handles retries automatically based on queue defaultJobOptions.

const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || "5", 10)

let storageWorker
let billingWorker
let authWorker

function setupWorkers() {
  const workerOptions = {
    concurrency: WORKER_CONCURRENCY,
  }

  // ── Storage Events Worker ──────────────────────────────────────────────────
  storageWorker = new Worker(
    QUEUE_NAMES.STORAGE_EVENTS,
    async (job) => dispatch(job),
    { ...workerOptions, connection: createRedisConnection() }
  )

  storageWorker.on("completed", (job) => {
    logger.info({ jobId: job.id, eventType: job.data?.eventType }, "Job completed")
  })

  storageWorker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, eventType: job?.data?.eventType, attempt: job?.attemptsMade, err },
      "Job failed"
    )
    // After all attempts exhausted, BullMQ moves job to failed set automatically.
    // Failed jobs persist for 7 days (see queue.js removeOnFail) — this IS your DLQ.
  })

  storageWorker.on("error", (err) => logger.error({ err }, "storageWorker error"))

  // ── Billing Events Worker ──────────────────────────────────────────────────
  billingWorker = new Worker(
    QUEUE_NAMES.BILLING_EVENTS,
    async (job) => dispatch(job),
    { ...workerOptions, connection: createRedisConnection() }
  )

  billingWorker.on("completed", (job) => {
    logger.info({ jobId: job.id, eventType: job.data?.eventType }, "Job completed")
  })

  billingWorker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, eventType: job?.data?.eventType, attempt: job?.attemptsMade, err },
      "Job failed"
    )
  })

  billingWorker.on("error", (err) => logger.error({ err }, "billingWorker error"))

  // ── Auth Events Worker ─────────────────────────────────────────────────────
  authWorker = new Worker(
    QUEUE_NAMES.AUTH_EVENTS,
    async (job) => dispatch(job),
    { ...workerOptions, connection: createRedisConnection() }
  )

  authWorker.on("completed", (job) => {
    logger.info({ jobId: job.id, eventType: job.data?.eventType }, "Job completed")
  })

  authWorker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, eventType: job?.data?.eventType, attempt: job?.attemptsMade, err },
      "Job failed"
    )
  })

  authWorker.on("error", (err) => logger.error({ err }, "authWorker error"))

  logger.info(
    { queues: Object.values(QUEUE_NAMES), concurrency: WORKER_CONCURRENCY },
    "BullMQ workers started"
  )
}

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────

async function teardownWorkers() {
  try {
    // Wait for in-progress jobs to finish before closing
    await Promise.all([
      storageWorker?.close(),
      billingWorker?.close(),
      authWorker?.close(),
    ])
    logger.info("BullMQ workers shut down gracefully")
  } catch (err) {
    logger.error({ err }, "Error shutting down BullMQ workers")
  }
}

module.exports = { setupWorkers, teardownWorkers }