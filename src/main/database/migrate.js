require("dotenv").config() 

const { sequelize } = require("./connection")
const models = require("./models")

async function runMigrations() {
  try {
    console.log(" Iniciando migraciones...")

    await sequelize.authenticate()
    console.log("Conexión a la base de datos establecida.")

    console.log(" Creando tablas...")
    await sequelize.sync({ force: false, alter: true })
    console.log("Tablas creadas/actualizadas correctamente.")

    const tables = await sequelize.getQueryInterface().showAllTables()
    console.log(" Tablas en la base de datos:", tables)

    console.log("Migraciones completadas exitosamente!")
    process.exit(0)
  } catch (error) {
    console.error("Error ejecutando migraciones:", error)
    process.exit(1)
  }
}

runMigrations()
