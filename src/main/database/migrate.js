require("dotenv").config() // Adding dotenv configuration to load environment variables

const { sequelize } = require("./connection")
const models = require("./models")

async function runMigrations() {
  try {
    console.log("🔄 Iniciando migraciones...")

    // Test connection first
    await sequelize.authenticate()
    console.log("✅ Conexión a la base de datos establecida.")

    // Force sync to create all tables with their relationships
    console.log("🔄 Creando tablas...")
    await sequelize.sync({ force: false, alter: true })
    console.log("✅ Tablas creadas/actualizadas correctamente.")

    // Verify tables were created
    const tables = await sequelize.getQueryInterface().showAllTables()
    console.log("📋 Tablas en la base de datos:", tables)

    console.log("🎉 Migraciones completadas exitosamente!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error ejecutando migraciones:", error)
    process.exit(1)
  }
}

runMigrations()
