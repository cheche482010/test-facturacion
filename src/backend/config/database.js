const { Sequelize } = require('sequelize')
const path = require('path')
const fs = require('fs')

// Cargar variables de entorno
require('dotenv').config()

// Configuración de la base de datos
const dbConfig = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'facturacion_db',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: process.env.DB_TYPE || 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    timezone: process.env.TZ || '-04:00', // Venezuela
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    }
  },
  production: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'facturacion_db',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: process.env.DB_TYPE || 'mysql',
    logging: false,
    timezone: process.env.TZ || '-04:00',
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    }
  }
}

// Crear directorio de base de datos si no existe
const dbDir = path.dirname(process.env.DB_SQLITE_PATH || path.join(__dirname, '../../../database/facturacion.sqlite'))
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Configuración para SQLite como fallback
const sqliteConfig = {
  dialect: 'sqlite',
  storage: process.env.DB_SQLITE_PATH || path.join(__dirname, '../../../database/facturacion.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  timezone: process.env.TZ || '-04:00',
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
}

// Seleccionar configuración según el entorno
const env = process.env.NODE_ENV || 'development'
const config = dbConfig[env] || sqliteConfig

// Crear instancia de Sequelize
const sequelize = new Sequelize(config)

// Función para probar la conexión
async function testConnection() {
  try {
    await sequelize.authenticate()
    console.log('✅ Conexión a la base de datos establecida correctamente.')
    return true
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message)
    return false
  }
}

// Función para inicializar la base de datos
async function initDatabase() {
  try {
    // Crear base de datos si no existe (solo para MySQL)
    if (config.dialect === 'mysql') {
      const tempSequelize = new Sequelize({
        ...config,
        database: undefined
      })
      
      await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`)
      await tempSequelize.close()
    }
    
    // Sincronizar modelos
    await sequelize.sync({ alter: true })
    console.log('✅ Base de datos inicializada correctamente.')
    return true
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message)
    return false
  }
}

// Función para hacer backup
async function backupDatabase(backupPath) {
  try {
    if (config.dialect === 'mysql') {
      // Backup para MySQL
      const { exec } = require('child_process')
      const command = `mysqldump -u ${config.username} -p${config.password} ${config.database} > ${backupPath}`
      
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(error)
          } else {
            resolve(backupPath)
          }
        })
      })
    } else {
      // Backup para SQLite
      const fs = require('fs')
      fs.copyFileSync(config.storage, backupPath)
      return backupPath
    }
  } catch (error) {
    throw new Error(`Error al hacer backup: ${error.message}`)
  }
}

// Función para restaurar backup
async function restoreDatabase(backupPath) {
  try {
    if (config.dialect === 'mysql') {
      // Restaurar para MySQL
      const { exec } = require('child_process')
      const command = `mysql -u ${config.username} -p${config.password} ${config.database} < ${backupPath}`
      
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(error)
          } else {
            resolve(true)
          }
        })
      })
    } else {
      // Restaurar para SQLite
      const fs = require('fs')
      fs.copyFileSync(backupPath, config.storage)
      return true
    }
  } catch (error) {
    throw new Error(`Error al restaurar backup: ${error.message}`)
  }
}

module.exports = {
  sequelize,
  testConnection,
  initDatabase,
  backupDatabase,
  restoreDatabase,
  config
}
