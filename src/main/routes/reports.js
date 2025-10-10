const express = require("express")
const express = require("express")
const { authenticateToken, authorize } = require("../middleware/auth")
const reportsController = require("../controllers/reportsController")

const router = express.Router()

router.use(authenticateToken)
router.use(authorize(["administrador", "dev"]))

router.get("/dashboard", reportsController.getDashboard)
router.get("/sales", reportsController.getSalesReport)
router.get("/products", reportsController.getProductsReport)
router.get("/inventory", reportsController.getInventoryReport)
router.get("/financial", reportsController.getFinancialReport)
router.get("/users", reportsController.getUsersReport)

module.exports = router
