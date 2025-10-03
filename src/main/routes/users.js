const express = require("express")
const { authenticateToken, requireRole } = require("../middleware/auth")
const usersController = require("../controllers/usersController")

const router = express.Router()

router.get("/", authenticateToken, requireRole("admin"), usersController.getAll)
router.post("/", authenticateToken, requireRole("admin"), usersController.create)
router.put("/:id", authenticateToken, requireRole("admin"), usersController.update)
router.delete("/:id", authenticateToken, requireRole("admin"), usersController.delete)

module.exports = router
