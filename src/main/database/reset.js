const { sequelize } = require("./connection")

async function resetDatabase() {
  try {
    console.log("⚠️  ADVERTENCIA: Esto eliminará todos los datos existentes!")
    console.log("🔄 Reseteando base de datos...")

    // Drop and recreate all tables
    await sequelize.sync({ force: true })
    console.log("✅ Base de datos reseteada correctamente.")

    // Run seeders
    console.log("🔄 Ejecutando seeders...")
    const { seedDefaultData } = require("./seeders/defaultData")
    await seedDefaultData()
    console.log("✅ Datos iniciales creados correctamente.")

    console.log("🎉 Base de datos reseteada exitosamente!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error reseteando la base de datos:", error)
    process.exit(1)
  }
}

resetDatabase()