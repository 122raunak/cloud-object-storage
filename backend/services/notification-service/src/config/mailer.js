const { Resend } = require("resend")
const logger = require("../utils/logger")

const resend = new Resend(process.env.SMTP_PASS)

async function verifyMailer() {
  logger.info("Resend HTTP API configured")
}

async function sendMail({ to, subject, html, text }) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "CloudStore <onboarding@resend.dev>",
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(),
    })

    if (error) {
      logger.error({ error, to, subject }, "❌ Email send failed")
      return false
    }

    logger.info({ messageId: data?.id, to, subject }, "✉️  Email sent")
    return true
  } catch (err) {
    logger.error({ err, to, subject }, "❌ Email send failed")
    return false
  }
}

module.exports = { sendMail, verifyMailer }