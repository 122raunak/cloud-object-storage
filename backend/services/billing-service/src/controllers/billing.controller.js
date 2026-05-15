const asyncHandler   = require("../utils/asyncHandler")
const ApiResponse    = require("../utils/ApiResponse")
const billingService = require("../services/billing.service")

// ── Plans ──────────────────────────────────────────────────────────────────

const listPlans = asyncHandler(async (req, res) => {
  const data = await billingService.listPlans()
  return res.status(200).json(new ApiResponse(200, data, "Pricing tiers retrieved"))
})

const assignPlan = asyncHandler(async (req, res) => {
  const { userId }  = req.params
  const { tierId }  = req.body   

  const data = await billingService.assignPlan(userId, tierId)
  return res.status(200).json(new ApiResponse(200, data, "Plan assigned successfully"))
})

// ── Invoices ───────────────────────────────────────────────────────────────

const listInvoices = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const data = await billingService.listInvoices(userId, req.query)
  return res.status(200).json(new ApiResponse(200, data, "Invoices retrieved"))
})

const getInvoice = asyncHandler(async (req, res) => {
  const { userId, invoiceId } = req.params
  const data = await billingService.getInvoice(userId, invoiceId)
  return res.status(200).json(new ApiResponse(200, data, "Invoice retrieved"))
})

const getCurrentEstimate = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const data = await billingService.getCurrentEstimate(userId)
  return res.status(200).json(new ApiResponse(200, data, "Current month estimate retrieved"))
})

const generateInvoice = asyncHandler(async (req, res) => {
  const { userId }      = req.params
  const { year, month } = req.body  

  const { invoice, created } = await billingService.generateInvoice(userId, year, month)

  const statusCode = created ? 201 : 200
  const message    = created ? "Invoice generated successfully" : "Invoice already exists"
  return res.status(statusCode).json(new ApiResponse(statusCode, invoice, message))
})

module.exports = {
  listPlans,
  assignPlan,
  listInvoices,
  getInvoice,
  getCurrentEstimate,
  generateInvoice,
}