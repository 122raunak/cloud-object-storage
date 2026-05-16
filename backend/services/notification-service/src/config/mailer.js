const logger = require("../utils/logger")

async function verifyMailer() {
  logger.info("Mailer configured")
}

async function sendMail({ to, subject, html, text }) {
  try {
    if (process.env.NODE_ENV === 'production') {
      const { Resend } = require("resend")
      const resend = new Resend(process.env.SMTP_PASS)
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "CloudStore <onboarding@resend.dev>",
        to, subject, html,
        text: text || html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(),
      })
      if (error) { logger.error({ error }, "❌ Email failed"); return false }
      logger.info({ messageId: data?.id, to, subject }, "✉️  Email sent")
      return true
    } else {
      const nodemailer = require("nodemailer")
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 5000,
      })
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to, subject, html,
        text: text || html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(),
      })
      logger.info({ messageId: info.messageId, to, subject }, "✉️  Email sent")
      return true
    }
  } catch (err) {
    logger.error({ err, to, subject }, "❌ Email send failed")
    return false
  }
}

module.exports = { sendMail, verifyMailer }