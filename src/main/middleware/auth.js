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
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado" })
    }

    const userRoles = Array.isArray(roles) ? roles : [roles]
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Permisos insuficientes" })
    }

    next()
  }
}

// Permission-based Authorization Middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado" })
    }

    const rolePermissions = {
      admin: ["all"],
      supervisor: ["sales", "inventory", "reports", "products", "settings"],
      cashier: ["sales"],
    }

    const userPermissions = rolePermissions[req.user.role] || []
    const hasPermission = userPermissions.includes("all") || userPermissions.includes(permission)

    if (!hasPermission) {
      return res.status(403).json({ error: "Permisos insuficientes" })
    }

    next()
  }
}

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
}
