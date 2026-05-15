const { Router } = require("express")
const { verifyToken, requireAdmin, requireOwnerOrAdmin } = require("../middlewares/auth.middleware")
const { defaultLimiter, generateInvoiceLimiter }         = require("../middlewares/rateLimiter.middleware")
const {
  validateQuery,
  validateBody,
  validateParams,
  invoiceListQuerySchema,
  invoiceParamsSchema,
  assignPlanBodySchema,
  generateInvoiceBodySchema,
} = require("../middlewares/validate.middleware")
const {
  listPlans,
  assignPlan,
  listInvoices,
  getInvoice,
  getCurrentEstimate,
  generateInvoice,
} = require("../controllers/billing.controller")

const router = Router()

// ── Public ─────────────────────────────────────────────────────────────────
router.get("/plans", defaultLimiter, listPlans)

// ── Authenticated ──────────────────────────────────────────────────────────
router.use(verifyToken)

// Plans — admin only
router.put(
  "/plans/:userId",
  requireAdmin,
  defaultLimiter,
  validateBody(assignPlanBodySchema),
  assignPlan
)

// Invoices — owner or admin
router.get(
  "/invoices/:userId",
  requireOwnerOrAdmin("userId"),
  defaultLimiter,
  validateQuery(invoiceListQuerySchema),
  listInvoices
)

router.get(
  "/invoices/:userId/:invoiceId",
  requireOwnerOrAdmin("userId"),
  defaultLimiter,
  validateParams(invoiceParamsSchema),
  getInvoice
)

router.get(
  "/current/:userId",
  requireOwnerOrAdmin("userId"),
  defaultLimiter,
  getCurrentEstimate
)

// Manual invoice generation — admin only
router.post(
  "/generate/:userId",
  requireAdmin,
  generateInvoiceLimiter,
  validateBody(generateInvoiceBodySchema),
  generateInvoice
)

module.exports = router