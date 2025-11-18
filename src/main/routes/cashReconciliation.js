const express = require("express")
const { authenticateToken, requirePermission, requireAdminForCashClosure } = require("../middleware/auth")
const CashReconciliationController = require("../controllers/CashReconciliationController")

const router = express.Router()

// Todas las rutas de este archivo requieren autenticación
router.use(authenticateToken)

// POST /api/cash-reconciliation - Crear una nueva apertura de caja
router.post("/", requirePermission("cash_reconciliation"), CashReconciliationController.create)

// GET /api/cash-reconciliation/today - Obtener la caja del día (abierta o para abrir)
router.get("/today", requirePermission("cash_reconciliation"), CashReconciliationController.getToday)


// PUT /api/cash-reconciliation/:id/close - Cerrar la caja (cajeros necesitan contraseña admin)
router.put("/:id/close", requirePermission("cash_reconciliation"), requireAdminForCashClosure, CashReconciliationController.close)

// GET /api/cash-reconciliation/:id/report - Obtener el reporte de ventas del día para un arqueo
router.get("/:id/report", requirePermission("cash_reconciliation"), CashReconciliationController.getReportById)

module.exports = router