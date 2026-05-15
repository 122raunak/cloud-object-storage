const nodemailer = require("nodemailer")
const logger = require("../utils/logger")

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
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: 5000,  // ← 5 seconds max, not 240
    greetingTimeout: 5000,
    socketTimeout: 5000,
  })
  return _transporter
}

async function verifyMailer() {
  try {
    await getTransporter().verify()
    logger.info("SMTP connection verified")
  } catch (err) {
    logger.error({ err }, "SMTP connection verification failed")
    throw err
  }
}

async function sendMail({ to, subject, html, text }) {
  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || "CloudStore <noreply@cloudstore.com>",
      to,
      subject,
      html,
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