const express = require("express")
const { authenticateToken, requireRole } = require("../middleware/auth")
const usersController = require("../controllers/usersController")

const router = express.Router()

router.get("/", authenticateToken, requireRole("dev"), usersController.getAll)
router.post("/", authenticateToken, requireRole("dev"), usersController.create)
router.put("/:id", authenticateToken, requireRole("dev"), usersController.update)
router.delete("/:id", authenticateToken, requireRole("dev"), usersController.delete)

module.exports = router
