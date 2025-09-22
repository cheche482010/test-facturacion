const express = require("express")
const jwt = require("jsonwebtoken")
const { User } = require("../database/models")
const { authenticateToken, requireRole } = require("../middleware/auth")

const router = express.Router()

// Login
router.post("/login", async (req, res) => {
  try {
    // El frontend envía 'username', pero contiene el email.
    // Lo leemos como 'username' y lo usamos para buscar en el campo 'email'.
    const { username: email, password } = req.body

    const user = await User.findOne({ where: { email: email, isActive: true } })
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" })
    }

    const isValidPassword = await user.validatePassword(password)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Contraseña incorrecta" })
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
// La lógica de invalidar el token se maneja en el cliente.
// El endpoint solo necesita confirmar que la llamada fue recibida.
router.post("/logout", authenticateToken, (req, res) => {
  res.json({ message: "Sesión cerrada exitosamente" })
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
