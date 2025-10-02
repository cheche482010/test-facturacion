const jwt = require("jsonwebtoken")
const { User } = require("../database/models")

const authController = {
  async login(req, res) {
    try {
      const { username: email, password } = req.body

      const user = await User.findOne({ where: { email: email, isActive: true } })
      if (!user) {
        return res.status(401).json({ error: "Usuario no encontrado" })
      }

      const isValidPassword = await user.validatePassword(password)
      if (!isValidPassword) {
        return res.status(401).json({ error: "Contraseña incorrecta" })
      }

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
  },

  async getMe(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ["password"] },
      })
      res.json({ user })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  logout(req, res) {
    res.json({ message: "Sesión cerrada exitosamente" })
  },

  async changePassword(req, res) {
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
  }
}

module.exports = authController