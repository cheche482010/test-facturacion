const express = require("express")
const { authenticateToken } = require("../middleware/auth")
const authController = require("../controllers/authController")

const router = express.Router()

router.post("/login", authController.login)
router.get("/me", authenticateToken, authController.getMe)
router.post("/logout", authController.logout)
router.post("/change-password", authenticateToken, authController.changePassword)

module.exports = router
