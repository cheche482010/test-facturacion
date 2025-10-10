const express = require("express")
const { authenticateToken, authorize } = require("../middleware/auth")
const CashReconciliationController = require("../controllers/CashReconciliationController")

const router = express.Router()

// Todas las rutas de este archivo requieren autenticación
router.use(authenticateToken)

// POST /api/cash-reconciliation - Crear una nueva apertura de caja
router.post("/", CashReconciliationController.create)

// GET /api/cash-reconciliation/today - Obtener la caja del día (abierta o para abrir)
router.get("/today", CashReconciliationController.getToday)

// GET /api/cash-reconciliation/report - Obtener reporte de cierres de caja
router.get("/report", authorize(["administrador", "dev"]), CashReconciliationController.getReport)

// PUT /api/cash-reconciliation/:id/close - Cerrar la caja
router.put("/:id/close", authorize(["administrador", "dev"]), CashReconciliationController.close)

// GET /api/cash-reconciliation/:id/report - Obtener el reporte de ventas del día para un arqueo
router.get("/:id/report", authorize(["administrador", "dev"]), CashReconciliationController.getReportById)

module.exports = router