const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { User } = require('../models')
const { validateToken } = require('../middleware/auth')

const router = express.Router()

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '24h'

// Middleware para validar datos de entrada
const validateLoginData = (req, res, next) => {
  const { username, password } = req.body
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Usuario y contraseña son requeridos'
    })
  }
  
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'La contraseña debe tener al menos 6 caracteres'
    })
  }
  
  next()
}

const validateRegisterData = (req, res, next) => {
  const { username, email, password, full_name, role } = req.body
  
  if (!username || !email || !password || !full_name) {
    return res.status(400).json({
      success: false,
      message: 'Todos los campos son requeridos'
    })
  }
  
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'La contraseña debe tener al menos 6 caracteres'
    })
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Email inválido'
    })
  }
  
  const validRoles = ['admin', 'cajero', 'inventario', 'vendedor']
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Rol inválido'
    })
  }
  
  next()
}

// Función para generar token JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

// POST /api/auth/login
router.post('/login', validateLoginData, async (req, res) => {
  try {
    const { username, password } = req.body
    
    // Buscar usuario por username o email
    const user = await User.findOne({
      where: {
        [sequelize.Op.or]: [
          { username: username },
          { email: username }
        ],
        is_active: true
      }
    })
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      })
    }
    
    // Verificar contraseña
    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      })
    }
    
    // Actualizar último login
    user.last_login = new Date()
    await user.save()
    
    // Generar token
    const token = generateToken(user)
    
    // Obtener permisos del usuario
    const permissions = User.ROLE_PERMISSIONS[user.role] || {}
    
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          permissions: permissions
        },
        token: token,
        expires_in: JWT_EXPIRES_IN
      }
    })
    
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/auth/register
router.post('/register', validateRegisterData, async (req, res) => {
  try {
    const { username, email, password, full_name, role = 'cajero' } = req.body
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      where: {
        [sequelize.Op.or]: [
          { username: username },
          { email: email }
        ]
      }
    })
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El usuario o email ya existe'
      })
    }
    
    // Crear nuevo usuario
    const user = await User.create({
      username,
      email,
      password,
      full_name,
      role,
      created_by: req.user?.id || 1 // Si no hay usuario autenticado, usar ID 1
    })
    
    // Generar token
    const token = generateToken(user)
    
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
        token: token
      }
    })
    
  } catch (error) {
    console.error('Error en registro:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/auth/me
router.get('/me', validateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    })
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }
    
    // Obtener permisos del usuario
    const permissions = User.ROLE_PERMISSIONS[user.role] || {}
    
    res.json({
      success: true,
      data: {
        user: {
          ...user.toJSON(),
          permissions: permissions
        }
      }
    })
    
  } catch (error) {
    console.error('Error al obtener perfil:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/auth/change-password
router.post('/change-password', validateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body
    
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva contraseña son requeridas'
      })
    }
    
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      })
    }
    
    const user = await User.findByPk(req.user.id)
    
    // Verificar contraseña actual
    const isValidPassword = await user.comparePassword(current_password)
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      })
    }
    
    // Actualizar contraseña
    user.password = new_password
    await user.save()
    
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    })
    
  } catch (error) {
    console.error('Error al cambiar contraseña:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/auth/logout
router.post('/logout', validateToken, (req, res) => {
  // En una implementación más robusta, podrías invalidar el token
  res.json({
    success: true,
    message: 'Logout exitoso'
  })
})

// GET /api/auth/verify
router.get('/verify', validateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    data: {
      user: req.user
    }
  })
})

module.exports = router

