const express = require('express')
const fs = require('fs')
const path = require('path')
const { validateToken, checkPermission } = require('../middleware/auth')
const { backupDatabase, restoreDatabase } = require('../config/database')

const router = express.Router()

// Directorio de backups
const backupDir = path.join(__dirname, '../../../data/backups')

// Crear directorio de backups si no existe
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true })
}

// GET /api/backup - Listar backups disponibles
router.get('/', validateToken, checkPermission('backup', 'read'), (req, res) => {
  try {
    const files = fs.readdirSync(backupDir)
    const backups = []
    
    for (const file of files) {
      if (file.endsWith('.sql') || file.endsWith('.sqlite')) {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)
        
        // Intentar leer metadatos si existe
        let metadata = {}
        const metadataPath = filePath.replace(/\.(sql|sqlite)$/, '.json')
        if (fs.existsSync(metadataPath)) {
          try {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
          } catch (error) {
            console.error('Error al leer metadatos:', error)
          }
        }
        
        backups.push({
          filename: file,
          size: stats.size,
          created_at: stats.birthtime,
          modified_at: stats.mtime,
          metadata: metadata
        })
      }
    }
    
    // Ordenar por fecha de creación (más reciente primero)
    backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    
    res.json({
      success: true,
      data: backups
    })
    
  } catch (error) {
    console.error('Error al listar backups:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/backup/create - Crear nuevo backup
router.post('/create', validateToken, checkPermission('backup', 'create'), async (req, res) => {
  try {
    const { description = '' } = req.body
    
    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup_${timestamp}.sql`
    const backupPath = path.join(backupDir, filename)
    
    // Crear backup
    await backupDatabase(backupPath)
    
    // Crear metadatos
    const metadata = {
      description: description,
      created_by: req.user.username,
      created_at: new Date().toISOString(),
      version: '1.0.0',
      database_type: 'mysql', // o sqlite según configuración
      file_size: fs.statSync(backupPath).size
    }
    
    const metadataPath = backupPath.replace('.sql', '.json')
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
    
    res.json({
      success: true,
      message: 'Backup creado exitosamente',
      data: {
        filename: filename,
        path: backupPath,
        size: metadata.file_size,
        metadata: metadata
      }
    })
    
  } catch (error) {
    console.error('Error al crear backup:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear backup: ' + error.message
    })
  }
})

// POST /api/backup/restore - Restaurar backup
router.post('/restore', validateToken, checkPermission('backup', 'restore'), async (req, res) => {
  try {
    const { filename } = req.body
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de archivo requerido'
      })
    }
    
    const backupPath = path.join(backupDir, filename)
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo de backup no encontrado'
      })
    }
    
    // Verificar que es un archivo de backup válido
    if (!filename.endsWith('.sql') && !filename.endsWith('.sqlite')) {
      return res.status(400).json({
        success: false,
        message: 'Archivo de backup inválido'
      })
    }
    
    // Restaurar backup
    await restoreDatabase(backupPath)
    
    res.json({
      success: true,
      message: 'Backup restaurado exitosamente',
      data: {
        filename: filename,
        restored_at: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Error al restaurar backup:', error)
    res.status(500).json({
      success: false,
      message: 'Error al restaurar backup: ' + error.message
    })
  }
})

// DELETE /api/backup/:filename - Eliminar backup
router.delete('/:filename', validateToken, checkPermission('backup', 'delete'), (req, res) => {
  try {
    const { filename } = req.params
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de archivo requerido'
      })
    }
    
    const backupPath = path.join(backupDir, filename)
    const metadataPath = backupPath.replace(/\.(sql|sqlite)$/, '.json')
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo de backup no encontrado'
      })
    }
    
    // Eliminar archivo de backup
    fs.unlinkSync(backupPath)
    
    // Eliminar metadatos si existe
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath)
    }
    
    res.json({
      success: true,
      message: 'Backup eliminado exitosamente',
      data: {
        filename: filename
      }
    })
    
  } catch (error) {
    console.error('Error al eliminar backup:', error)
    res.status(500).json({
      success: false,
      message: 'Error al eliminar backup'
    })
  }
})

// GET /api/backup/:filename/download - Descargar backup
router.get('/:filename/download', validateToken, checkPermission('backup', 'read'), (req, res) => {
  try {
    const { filename } = req.params
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de archivo requerido'
      })
    }
    
    const backupPath = path.join(backupDir, filename)
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo de backup no encontrado'
      })
    }
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    
    // Enviar archivo
    const fileStream = fs.createReadStream(backupPath)
    fileStream.pipe(res)
    
  } catch (error) {
    console.error('Error al descargar backup:', error)
    res.status(500).json({
      success: false,
      message: 'Error al descargar backup'
    })
  }
})

// POST /api/backup/upload - Subir backup (placeholder)
router.post('/upload', validateToken, checkPermission('backup', 'create'), (req, res) => {
  try {
    // Esta funcionalidad requeriría middleware de multer para manejar archivos
    // Por ahora es un placeholder
    res.json({
      success: true,
      message: 'Funcionalidad de subida de backup en desarrollo',
      data: {
        uploaded: false
      }
    })
    
  } catch (error) {
    console.error('Error al subir backup:', error)
    res.status(500).json({
      success: false,
      message: 'Error al subir backup'
    })
  }
})

// GET /api/backup/auto - Obtener configuración de backup automático
router.get('/auto', validateToken, checkPermission('backup', 'read'), (req, res) => {
  try {
    // Leer configuración desde archivo de config
    const configPath = path.join(__dirname, '../../../data/config.json')
    let config = {}
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    }
    
    res.json({
      success: true,
      data: config.backup || {
        auto_backup: false,
        backup_interval: 24,
        keep_backups: 7,
        backup_path: backupDir
      }
    })
    
  } catch (error) {
    console.error('Error al obtener configuración de backup automático:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/backup/auto - Actualizar configuración de backup automático
router.post('/auto', validateToken, checkPermission('backup', 'update'), (req, res) => {
  try {
    const { auto_backup, backup_interval, keep_backups, backup_path } = req.body
    
    const configPath = path.join(__dirname, '../../../data/config.json')
    let config = {}
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    }
    
    // Actualizar configuración de backup
    config.backup = {
      auto_backup: Boolean(auto_backup),
      backup_interval: parseInt(backup_interval) || 24,
      keep_backups: parseInt(keep_backups) || 7,
      backup_path: backup_path || backupDir
    }
    
    // Guardar configuración
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    
    res.json({
      success: true,
      message: 'Configuración de backup automático actualizada',
      data: config.backup
    })
    
  } catch (error) {
    console.error('Error al actualizar configuración de backup automático:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/backup/cleanup - Limpiar backups antiguos
router.post('/cleanup', validateToken, checkPermission('backup', 'delete'), (req, res) => {
  try {
    const { keep_days = 7 } = req.body
    
    const files = fs.readdirSync(backupDir)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(keep_days))
    
    let deletedCount = 0
    const deletedFiles = []
    
    for (const file of files) {
      if (file.endsWith('.sql') || file.endsWith('.sqlite')) {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)
        
        if (stats.created_at < cutoffDate) {
          // Eliminar archivo de backup
          fs.unlinkSync(filePath)
          
          // Eliminar metadatos si existe
          const metadataPath = filePath.replace(/\.(sql|sqlite)$/, '.json')
          if (fs.existsSync(metadataPath)) {
            fs.unlinkSync(metadataPath)
          }
          
          deletedCount++
          deletedFiles.push(file)
        }
      }
    }
    
    res.json({
      success: true,
      message: `Limpieza completada. ${deletedCount} archivos eliminados.`,
      data: {
        deleted_count: deletedCount,
        deleted_files: deletedFiles,
        cutoff_date: cutoffDate.toISOString()
      }
    })
    
  } catch (error) {
    console.error('Error al limpiar backups:', error)
    res.status(500).json({
      success: false,
      message: 'Error al limpiar backups'
    })
  }
})

// GET /api/backup/status - Estado del sistema de backup
router.get('/status', validateToken, checkPermission('backup', 'read'), (req, res) => {
  try {
    const files = fs.readdirSync(backupDir)
    const backupFiles = files.filter(file => file.endsWith('.sql') || file.endsWith('.sqlite'))
    
    let totalSize = 0
    let oldestBackup = null
    let newestBackup = null
    
    for (const file of backupFiles) {
      const filePath = path.join(backupDir, file)
      const stats = fs.statSync(filePath)
      
      totalSize += stats.size
      
      if (!oldestBackup || stats.created_at < oldestBackup.created_at) {
        oldestBackup = { filename: file, created_at: stats.created_at }
      }
      
      if (!newestBackup || stats.created_at > newestBackup.created_at) {
        newestBackup = { filename: file, created_at: stats.created_at }
      }
    }
    
    // Leer configuración
    const configPath = path.join(__dirname, '../../../data/config.json')
    let config = {}
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    }
    
    const backupConfig = config.backup || {}
    
    res.json({
      success: true,
      data: {
        total_backups: backupFiles.length,
        total_size: totalSize,
        oldest_backup: oldestBackup,
        newest_backup: newestBackup,
        auto_backup_enabled: backupConfig.auto_backup || false,
        backup_interval: backupConfig.backup_interval || 24,
        keep_backups: backupConfig.keep_backups || 7,
        backup_directory: backupDir
      }
    })
    
  } catch (error) {
    console.error('Error al obtener estado de backup:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

module.exports = router
