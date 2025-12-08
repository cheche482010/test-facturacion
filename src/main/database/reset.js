const { sequelize } = require("./connection")

async function resetDatabase() {
  try {
    console.log(" ADVERTENCIA: Esto eliminará todos los datos existentes!")
    console.log("Reseteando base de datos...")

    await sequelize.sync({ force: true })
    console.log("Base de datos reseteada correctamente.")

    console.log("Ejecutando seeders...")
    const { runAllSeeders } = require("./seeders/index")
    await runAllSeeders()
    console.log("Datos iniciales creados correctamente.")

    console.log("Base de datos reseteada exitosamente!")
    process.exit(0)
  } catch (error) {
    console.error("Error reseteando la base de datos:", error)
    process.exit(1)
  }
}

resetDatabase()