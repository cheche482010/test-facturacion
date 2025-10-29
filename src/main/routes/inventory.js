const express = require("express")
const { authenticateToken, requirePermission } = require("../middleware/auth")
const inventoryController = require("../controllers/inventoryController")

const router = express.Router()

router.use(authenticateToken)

router.get("/movements", requirePermission("inventory"), inventoryController.getMovements)
router.get("/movements/product/:productId", requirePermission("inventory"), inventoryController.getProductMovements)
router.post("/adjust-stock", requirePermission("inventory"), inventoryController.adjustStock)
router.post("/mass-adjustment", requirePermission("inventory"), inventoryController.massAdjustment)
router.get("/report", requirePermission("inventory"), inventoryController.getReport)
router.get("/alerts", requirePermission("inventory"), inventoryController.getAlerts)

module.exports = router
