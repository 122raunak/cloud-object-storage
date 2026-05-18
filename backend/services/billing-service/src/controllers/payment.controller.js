const asyncHandler = require("../utils/asyncHandler")
const ApiResponse = require("../utils/ApiResponse")
const paymentService = require("../services/payment.service")

const createOrder = asyncHandler(async (req, res) => {
  const { userId, invoiceId } = req.params
  const result = await paymentService.createOrder(userId, parseInt(invoiceId))
  return res.status(200).json(new ApiResponse(200, result, "Order created"))
})

const verifyPayment = asyncHandler(async (req, res) => {
  const { userId, invoiceId } = req.params
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
  const invoice = await paymentService.verifyAndMarkPaid(
    userId, parseInt(invoiceId),
    { razorpay_order_id, razorpay_payment_id, razorpay_signature }
  )
  return res.status(200).json(new ApiResponse(200, invoice, "Payment successful — invoice marked as paid"))
})

module.exports = { createOrder, verifyPayment }