const express = require("express")
const { authenticateToken, requireRole } = require("../middleware/auth")
const usersController = require("../controllers/usersController")

const router = express.Router()

router.get("/", authenticateToken, requireRole("administrador"), usersController.getAll)
router.post("/", authenticateToken, requireRole("administrador"), usersController.create)
router.put("/:id", authenticateToken, requireRole("administrador"), usersController.update)
router.delete("/:id", authenticateToken, requireRole("administrador"), usersController.delete)

module.exports = router
