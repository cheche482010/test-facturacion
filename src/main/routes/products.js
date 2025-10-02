const express = require("express")
const { authenticateToken } = require("../middleware/auth")
const productsController = require("../controllers/productsController")

const router = express.Router()

router.use(authenticateToken)

router.get("/", productsController.getAll)
router.get("/:id", productsController.getById)
router.post("/", productsController.create)
router.put("/:id", productsController.update)
router.delete("/:id", productsController.delete)
router.put("/:id/stock", productsController.updateStock)

module.exports = router
