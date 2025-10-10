const jwt = require("jsonwebtoken")
const { User } = require("../database/models/index.js")

// JWT Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Token de acceso requerido" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findByPk(decoded.userId)

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Usuario no válido" })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ error: "Token inválido" })
  }
}

// Role-based Authorization Middleware
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    const { user } = req

    if (!user || !user.role) {
      return res.status(403).json({ message: "Forbidden: No role assigned" })
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" })
    }

    next()
  }
}
module.exports = {
  authenticateToken,
  authorize,
}
