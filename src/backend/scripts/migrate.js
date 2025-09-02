const { sequelize } = require('../config/database')
const defineModels = require('../models/index')
const initializeData = require('./initData')

async function migrate() {
    try {
        console.log('Iniciando migración de la base de datos...')

        await sequelize.authenticate()
        console.log('Conexión a la base de datos establecida correctamente.')

        // Inicializar modelos y asociaciones
        const models = defineModels(sequelize)
        console.log('Modelos y asociaciones inicializados.')

        // Sincronizar modelos
        await sequelize.sync({ alter: true })
        console.log('Modelos sincronizados.')

        // Crear datos iniciales
        await initializeData(models)
        console.log('Datos iniciales creados.')

        console.log('Migración completada exitosamente.')
        process.exit(0)
    } catch (error) {
        console.error('Error durante la migración:', error)
        process.exit(1)
    }
}

migrate()
