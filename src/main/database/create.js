require("dotenv").config() 

const { sequelize } = require("./connection")

async function createDatabase() {
  try {
    console.log("🔄 Creando base de datos...")

    if (process.env.DB_TYPE === "mysql") {
      const mysql = require("mysql2/promise")

      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
      })

      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "facturacion_db"}\``)
      console.log(` Base de datos '${process.env.DB_NAME || "facturacion_db"}' creada/verificada.`)

      await connection.end()
    }
    
    await sequelize.authenticate()
    console.log(" Conexión a la base de datos establecida correctamente.")

    console.log(" Base de datos lista para migraciones!")
    process.exit(0)
  } catch (error) {
    console.error("Error creando la base de datos:", error)
    process.exit(1)
  }
}

createDatabase()
