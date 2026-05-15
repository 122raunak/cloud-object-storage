const nodemailer = require("nodemailer")
const logger = require("../utils/logger")

// ─── Lazy transporter — created after env validation runs ─────────────────────
let _transporter = null

function getTransporter() {
  if (_transporter) return _transporter

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Connection pool — reuse SMTP connections instead of creating one per email
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  })

  return _transporter
}

/**
 * Verify SMTP connection on startup — fail fast if credentials are wrong.
 * Call this once during server boot, not on every send.
 */
async function verifyMailer() {
  try {
    await getTransporter().verify()
    logger.info("SMTP connection verified")
  } catch (err) {
    logger.error({ err }, "SMTP connection verification failed")
    throw err 
  }
}

/**
 * Send an email — non-fatal. Logs errors but never throws.
 * @returns {Promise<boolean>} true if sent, false if failed
 */
async function sendMail({ to, subject, html, text }) {
  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || "CloudStore <noreply@cloudstore.com>",
      to,
      subject,
      html,
      // Always include plain-text alternative — improves deliverability + spam scoring
      text: text || html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(),
    })
    logger.info({ messageId: info.messageId, to, subject }, "✉️  Email sent")
    return true
  } catch (err) {
    logger.error({ err, to, subject }, "❌ Email send failed")
    return false
  }
}

module.exports = { sendMail, verifyMailer }