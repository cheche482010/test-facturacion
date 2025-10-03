const express = require("express")
const { authenticateToken } = require("../middleware/auth")
const inventoryController = require("../controllers/inventoryController")

const router = express.Router()

router.use(authenticateToken)

router.get("/movements", inventoryController.getMovements)
router.get("/movements/product/:productId", inventoryController.getProductMovements)
router.post("/adjust-stock", inventoryController.adjustStock)
router.post("/mass-adjustment", inventoryController.massAdjustment)
router.get("/report", inventoryController.getReport)
router.get("/alerts", inventoryController.getAlerts)

module.exports = router
