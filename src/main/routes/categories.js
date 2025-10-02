const express = require("express")
const { authenticateToken } = require("../middleware/auth")
const categoriesController = require("../controllers/categoriesController")

const router = express.Router()

router.use(authenticateToken)

router.get("/", categoriesController.getAll)
router.post("/", categoriesController.create)
router.put("/:id", categoriesController.update)
router.delete("/:id", categoriesController.delete)

module.exports = router
