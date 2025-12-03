const { Sequelize } = require("sequelize")
const path = require("path")

const getDatabaseConfig = () => {
  const dbType = process.env.DB_TYPE || "sqlite"

  if (dbType.toLowerCase() === "mysql") {
    return {
      dialect: "mysql",
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME || "facturacion",
      username: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  } else {
    return {
      dialect: "sqlite",
      dialectModule: require('better-sqlite3'),
      storage: path.join(__dirname, "../../../data/database.sqlite"),
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    }
  }
}

const sequelize = new Sequelize(getDatabaseConfig())

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate()
    console.log("Conexión a la base de datos establecida correctamente.")

    require("./models")

    await sequelize.sync({ alter: true })
    console.log("Modelos sincronizados correctamente.")

    const { runAllSeeders } = require("./seeders/index")
    await runAllSeeders()
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error)
    throw error
  }
}

module.exports = { sequelize, initializeDatabase }
