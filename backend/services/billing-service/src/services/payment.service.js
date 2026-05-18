const crypto = require("crypto")
const { pool } = require("../config/db")
const ApiError = require("../utils/ApiError")
const logger = require("../utils/logger")

const getRazorpay = () => {
  const Razorpay = require("razorpay")
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

class PaymentService {

  async createOrder(userId, invoiceId) {
    const { rows } = await pool.query(
      `SELECT * FROM invoices WHERE id = $1 AND user_id = $2`,
      [invoiceId, userId]
    )
    if (rows.length === 0) throw new ApiError(404, "Invoice not found")
    const invoice = rows[0]
    if (invoice.status === "paid") throw new ApiError(400, "Invoice already paid")
    if (invoice.status === "void") throw new ApiError(400, "Invoice is void")

    const amountInCents = Math.max(
      100,
      Math.round(parseFloat(invoice.total_amount) * 100)
    )

    const razorpay = getRazorpay()
    const order = await razorpay.orders.create({
      amount:   amountInCents,
      currency: "USD",
      receipt:  `invoice_${invoiceId}`,
      notes: {
        invoiceId: String(invoiceId),
        userId:    String(userId),
        period:    invoice.period_start,
      }
    })

    logger.info({ orderId: order.id, invoiceId, userId }, "Razorpay order created")
    return { order, invoice }
  }

  async verifyAndMarkPaid(userId, invoiceId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, "Invalid payment signature")
    }

    const { rows } = await pool.query(
      `UPDATE invoices
       SET status = 'paid', updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [invoiceId, userId]
    )

    if (rows.length === 0) throw new ApiError(404, "Invoice not found")

    logger.info({ invoiceId, userId, paymentId: razorpay_payment_id }, "Invoice marked as paid")
    return rows[0]
  }
}

module.exports = new PaymentService()