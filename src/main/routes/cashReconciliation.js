const express = require("express")
const { authenticateToken, requirePermission, requireAdminForCashClosure } = require("../middleware/auth")
const CashReconciliationController = require("../controllers/CashReconciliationController")

const router = express.Router()

router.use(authenticateToken)
router.post("/", requirePermission("cash_reconciliation"), CashReconciliationController.create)
router.get("/today", requirePermission("cash_reconciliation"), CashReconciliationController.getToday)
router.put("/:id/close", requirePermission("cash_reconciliation"), requireAdminForCashClosure, CashReconciliationController.close)
router.get("/:id/report", requirePermission("cash_reconciliation"), CashReconciliationController.getReportById)

module.exports = router