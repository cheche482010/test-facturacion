const express = require("express")
const jwt = require("jsonwebtoken")
const { User } = require("../database/models")
const { authenticateToken, requireRole } = require("../middleware/auth")

const router = express.Router()

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body

    const user = await User.findOne({ where: { username, isActive: true } })
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    const isValidPassword = await user.validatePassword(password)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    // Actualizar último login
    await user.update({ lastLogin: new Date() })

    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    })

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get current user info
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    })

    res.json({ user })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Logout
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // In a more complex system, you might want to blacklist the token
    // For now, we'll just return success and let the client handle token removal
    res.json({ message: "Sesión cerrada exitosamente" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Change password
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findByPk(req.user.id)

    const isValidPassword = await user.validatePassword(currentPassword)
    if (!isValidPassword) {
      return res.status(400).json({ error: "Contraseña actual incorrecta" })
    }

    await user.update({ password: newPassword })
    res.json({ message: "Contraseña actualizada exitosamente" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
