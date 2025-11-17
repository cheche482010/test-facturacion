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

      const [databases] = await sequelize.query("SHOW DATABASES")
      console.log(" Bases de datos disponibles:")
      databases.forEach((db) => console.log(`   - ${db.Database}`))

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
