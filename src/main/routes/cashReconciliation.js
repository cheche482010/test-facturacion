const express = require("express")
const { authenticateToken } = require("../middleware/auth")
const CashReconciliationController = require("../controllers/CashReconciliationController")

const router = express.Router()

// Todas las rutas de este archivo requieren autenticación
router.use(authenticateToken)

// POST /api/cash-reconciliation - Crear una nueva apertura de caja
router.post("/", CashReconciliationController.create)

// GET /api/cash-reconciliation/today - Obtener la caja del día (abierta o para abrir)
router.get("/today", CashReconciliationController.getToday)

// GET /api/cash-reconciliation/report - Obtener reporte de cierres de caja
router.get("/report", CashReconciliationController.getReport)

// PUT /api/cash-reconciliation/:id/close - Cerrar la caja
router.put("/:id/close", CashReconciliationController.close)

module.exports = router