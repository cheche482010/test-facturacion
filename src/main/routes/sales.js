const express = require("express")
const { authenticateToken, requirePermission } = require("../middleware/auth")
const salesController = require("../controllers/salesController")

const router = express.Router()

router.use(authenticateToken)

router.get("/", requirePermission("sales"), salesController.getAll)
router.post("/", requirePermission("sales"), salesController.create)
router.get("/:id", requirePermission("sales"), salesController.getById)
router.put("/:id/cancel", requirePermission("sales"), salesController.cancel)
router.get("/:id/invoice", requirePermission("sales"), salesController.getInvoice)

module.exports = router