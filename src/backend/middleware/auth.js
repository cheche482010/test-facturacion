const jwt = require('jsonwebtoken')
const { User } = require('../models')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Middleware para validar token JWT
const validateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autorización requerido'
      })
    }
    
    const token = authHeader.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autorización requerido'
      })
    }
    
    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Buscar usuario en la base de datos
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    })
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no válido o inactivo'
      })
    }
    
    // Agregar usuario al request
    req.user = user
    next()
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      })
    }
    
    console.error('Error en validación de token:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// Middleware para verificar permisos
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      })
    }
    
    const hasPermission = req.user.hasPermission(resource, action)
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      })
    }
    
    next()
  }
}

// Middleware para verificar rol
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      })
    }
    
    const userRole = req.user.role
    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      })
    }
    
    next()
  }
}

// Middleware para verificar si es admin
const requireAdmin = (req, res, next) => {
  return checkRole('admin')(req, res, next)
}

// Middleware para verificar si es cajero o admin
const requireCashierOrAdmin = (req, res, next) => {
  return checkRole(['admin', 'cajero'])(req, res, next)
}

// Middleware para verificar si es inventario o admin
const requireInventoryOrAdmin = (req, res, next) => {
  return checkRole(['admin', 'inventario'])(req, res, next)
}

// Middleware para verificar si es vendedor o admin
const requireSellerOrAdmin = (req, res, next) => {
  return checkRole(['admin', 'vendedor'])(req, res, next)
}

module.exports = {
  validateToken,
  checkPermission,
  checkRole,
  requireAdmin,
  requireCashierOrAdmin,
  requireInventoryOrAdmin,
  requireSellerOrAdmin
}
