const express = require("express")
const { authenticateToken } = require("../middleware/auth")
const salesController = require("../controllers/salesController")

const router = express.Router()

router.use(authenticateToken)

router.get("/", salesController.getAll)
router.post("/", salesController.create)
router.get("/:id", salesController.getById)
router.put("/:id/cancel", salesController.cancel)
router.get("/:id/invoice", salesController.getInvoice)

module.exports = router