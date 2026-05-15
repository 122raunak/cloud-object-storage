const { Worker } = require("bullmq")
const meteringService = require("../services/metering.service")
const logger = require("../utils/logger")

let worker

function setupWorkers() {
  worker = new Worker(
    "storage-events-metering",
    async (job) => {
      const { eventId, eventType, data } = job.data
      logger.info(
        { jobId: job.id, eventType, userId: data?.userId, attempt: job.attemptsMade + 1 },
        "Metering event received"
      )
      await meteringService.recordEvent(eventId, eventType, {
        userId:   data.userId,
        fileId:   data.fileId,
        fileName: data.fileName,
        size:     data.size,
        mimeType: data.mimeType,
      })
    },
    {
      connection: {
        host:                 process.env.REDIS_HOST,
        port:                 parseInt(process.env.REDIS_PORT, 10),
        password:             process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
        tls: process.env.NODE_ENV === 'production' ? {} : undefined,
      },
      concurrency: 10,
    }
  )

  worker.on("completed", (job) => {
    logger.info(
      { jobId: job.id, eventType: job.data?.eventType, userId: job.data?.data?.userId },
      "Metering job completed"
    )
  })

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, eventType: job?.data?.eventType, attempt: job?.attemptsMade, err },
      "Metering job failed"
    )
  })

  worker.on("error", (err) => logger.error({ err }, "Metering BullMQ worker error"))
  logger.info("Metering BullMQ worker started — consuming storage-events-metering queue")
}

async function teardownWorkers() {
  try {
    await worker?.close()
    logger.info("Metering BullMQ worker shut down gracefully")
  } catch (err) {
    logger.error({ err }, "Error shutting down metering BullMQ worker")
  }
}

module.exports = { setupWorkers, teardownWorkers }