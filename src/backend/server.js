const express = require('express')
const cors = require('cors')
const path = require('path')
const { sequelize } = require('./config/database')
const initializeData = require('./scripts/initData')
const authRoutes = require('./routes/authRoutes')
const productRoutes = require('./routes/productRoutes')
const inventoryRoutes = require('./routes/inventoryRoutes')
const customerRoutes = require('./routes/customerRoutes')
const saleRoutes = require('./routes/saleRoutes')
const reportRoutes = require('./routes/reportRoutes')
const configRoutes = require('./routes/configRoutes')
const backupRoutes = require('./routes/backupRoutes')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../dist')))
}

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Middleware de autenticación global (excepto para login)
app.use((req, res, next) => {
  const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/config', '/api/config/init']
  if (publicPaths.includes(req.path)) {
    return next()
  }
  
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' })
  }
  
  // Verificar token aquí
  next()
})

// Rutas API
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/sales', saleRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/config', configRoutes)
app.use('/api/backup', backupRoutes)

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  })
})

// Ruta catch-all para SPA
app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../../dist/index.html'))
  } else {
    res.status(404).json({ message: 'Ruta no encontrada' })
  }
})

// Inicializar base de datos y servidor
async function startServer() {
  try {
    await sequelize.authenticate()
    console.log('Conexión a la base de datos establecida correctamente.')
    
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`)
    })
  } catch (error) {
    console.error('Error al iniciar el servidor:', error)
    process.exit(1)
  }
}

startServer()

module.exports = app
