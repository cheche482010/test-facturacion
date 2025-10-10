const express = require("express")
const express = require("express")
const { authenticateToken, authorize } = require("../middleware/auth")
const usersController = require("../controllers/usersController")

const router = express.Router()

router.get("/", authenticateToken, authorize(["dev", "administrador"]), usersController.getAll)
router.post("/", authenticateToken, authorize(["dev", "administrador"]), usersController.create)
router.put("/:id", authenticateToken, authorize(["dev", "administrador"]), usersController.update)
router.delete("/:id", authenticateToken, authorize(["dev", "administrador"]), usersController.delete)

module.exports = router
