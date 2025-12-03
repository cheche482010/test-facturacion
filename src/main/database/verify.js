require("dotenv").config() 

const { sequelize } = require("./connection")

async function verifyDatabase() {
  try {
    console.log("Verificando estado de la base de datos...")

    await sequelize.authenticate()
    console.log(" Conexión establecida correctamente.")

    if (process.env.DB_TYPE === "mysql") {
      const [result] = await sequelize.query("SELECT DATABASE() as current_db")
      console.log(`Base de datos actual: ${result[0].current_db}`)

      const tables = await sequelize.getQueryInterface().showAllTables()
      console.log(` Tablas en '${result[0].current_db}':`, tables)

      if (tables.length > 0) {
        console.log(" Registros por tabla:")
        for (const table of tables) {
          try {
            const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM \`${table}\``)
            console.log(`   ${table}: ${count[0].count} registros`)
          } catch (error) {
            console.log(`   ${table}: Error al contar registros`)
          }
        }

        console.log("\n Detalles de registros:")
        try {
          const [sales] = await sequelize.query(`SELECT id, sale_number, sale_date, reconciliation_id FROM sales LIMIT 5`)
          console.log("   Ventas (primeras 5):", sales)
        } catch (error) {
          console.log("   Error obteniendo ventas:", error.message)
        }

        try {
          const [reconciliations] = await sequelize.query(`SELECT id, lote, opening_date, closing_date FROM cash_reconciliations LIMIT 5`)
          console.log("   Arqueos (primeros 5):", reconciliations)
        } catch (error) {
          console.log("   Error obteniendo arqueos:", error.message)
        }
      }
    } else {
      const tables = await sequelize.getQueryInterface().showAllTables()
      console.log("Tablas:", tables)
    }

    process.exit(0)
  } catch (error) {
    console.error(" Error verificando la base de datos:", error)
    process.exit(1)
  }
}

verifyDatabase()
