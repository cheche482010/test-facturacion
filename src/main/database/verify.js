require("dotenv").config() 

const { sequelize } = require("./connection")

async function verifyDatabase() {
  try {
    console.log("Verificando estado de la base de datos...")

    await sequelize.authenticate()
    console.log("✓ Conexión a la base de datos establecida correctamente.")

    const tables = await sequelize.getQueryInterface().showAllTables()

    if (tables.length === 0) {
      console.log("✗ No se encontraron tablas en la base de datos.")
      console.log("Ejecuta 'npm run db:migrate' para crear las tablas.")
      process.exit(1)
    }

    console.log(`✓ Se encontraron ${tables.length} tablas en la base de datos:`)
    tables.forEach(table => {
      console.log(`  - ${table}`)
    })

    const requiredTables = ['users', 'categories', 'products', 'sales', 'settings']
    const missingTables = requiredTables.filter(table => !tables.includes(table))

    if (missingTables.length > 0) {
      console.log(`✗ Faltan las siguientes tablas principales: ${missingTables.join(', ')}`)
      console.log("Ejecuta 'npm run db:migrate' para crear las tablas faltantes.")
      process.exit(1)
    }

    console.log("✓ Todas las tablas principales están creadas correctamente.")
    console.log("✓ Verificación completada exitosamente.")

    process.exit(0)
  } catch (error) {
    console.error("✗ Error verificando la base de datos:", error.message)
    process.exit(1)
  }
}

verifyDatabase()
