const express = require("express")
const { authenticateToken, requirePermission } = require("../middleware/auth")
const reportsController = require("../controllers/reportsController")

const router = express.Router()

router.use(authenticateToken)

router.get("/dashboard", requirePermission("reports"), reportsController.getDashboard)
router.get("/sales", requirePermission("reports"), reportsController.getSalesReport)
router.get("/products", requirePermission("reports"), reportsController.getProductsReport)
router.get("/inventory", requirePermission("reports"), reportsController.getInventoryReport)
router.get("/financial", requirePermission("reports"), reportsController.getFinancialReport)
router.get("/users", requirePermission("reports"), reportsController.getUsersReport)
router.get("/cash-count", requirePermission("reports"), reportsController.getCashCount)
router.get("/sales/detailed", requirePermission("reports"), reportsController.getDetailedSalesReport)
router.get("/sales/batches", requirePermission("reports"), reportsController.getDetailedSalesReportByBatches)
router.get("/inventory/detailed", requirePermission("reports"), reportsController.getDetailedInventoryReport)
router.get("/inventory/adjustments", requirePermission("reports"), reportsController.getInventoryAdjustmentsReport)
router.get("/inventory/products", requirePermission("reports"), reportsController.getProductInventoryReport)
router.get("/financial/sales", requirePermission("reports"), reportsController.getFinancialSalesReport)

module.exports = router
