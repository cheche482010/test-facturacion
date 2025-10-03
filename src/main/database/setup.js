require("dotenv").config()

const { sequelize } = require("./connection")
const models = require("./models")

async function setupDatabase() {
  try {
    console.log("🔄 Configuración completa de la base de datos...")

    console.log("🔍 Configuración de conexión:")
    console.log(`   Tipo de BD: ${process.env.DB_TYPE || "sqlite"}`)
    if (process.env.DB_TYPE === "mysql") {
      console.log(`   Host: ${process.env.DB_HOST || "localhost"}`)
      console.log(`   Puerto: ${process.env.DB_PORT || 3306}`)
      console.log(`   Base de datos: ${process.env.DB_NAME || "facturacion_db"}`)
      console.log(`   Usuario: ${process.env.DB_USER || "root"}`)
      console.log(`   Contraseña: ${process.env.DB_PASSWORD ? "***" : "(vacía)"}`)
    }

    // Step 1: Create database (for MySQL)
    if (process.env.DB_TYPE === "mysql") {
      console.log("🔄 Verificando/creando base de datos MySQL...")
      const mysql = require("mysql2/promise")

      const connectionConfig = {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
      }

      const connection = await mysql.createConnection(connectionConfig)

      const dbName = process.env.DB_NAME || "facturacion_db"
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
      console.log(`✅ Base de datos '${dbName}' lista.`)

      const [databases] = await connection.execute("SHOW DATABASES")
      const dbExists = databases.some((db) => db.Database === dbName)
      console.log(`🔍 Verificación: Base de datos '${dbName}' ${dbExists ? "EXISTE" : "NO EXISTE"}`)

      await connection.end()
    }

    // Step 2: Test connection
    console.log("🔄 Conectando a la base de datos...")
    await sequelize.authenticate()
    console.log("✅ Conexión establecida correctamente.")

    if (process.env.DB_TYPE === "mysql") {
      const [result] = await sequelize.query("SELECT DATABASE() as current_db")
      console.log(`🔍 Base de datos actual: ${result[0].current_db}`)
    }

    // Step 3: Create tables
    console.log("🔄 Creando tablas...")
    await sequelize.sync({ force: false, alter: true })

    // Verify tables were created
    const tables = await sequelize.getQueryInterface().showAllTables()
    console.log("📋 Tablas creadas:", tables)
    console.log("✅ Tablas creadas correctamente.")

    if (process.env.DB_TYPE === "mysql") {
      const dbName = process.env.DB_NAME || "facturacion_db"
      const [tableCount] = await sequelize.query(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = '${dbName}'
      `)
      console.log(`🔍 Total de tablas en '${dbName}': ${tableCount[0].table_count}`)
    }

    // Step 4: Run seeders
    console.log("🔄 Ejecutando seeders...")
    const { seedDefaultData } = require("./seeders/defaultData")
    await seedDefaultData()
    console.log("✅ Datos iniciales creados correctamente.")

    console.log("🎉 Base de datos configurada exitosamente!")
    console.log("📝 Puedes usar los siguientes comandos:")
    console.log("   npm run db:create  - Solo crear la base de datos")
    console.log("   npm run db:migrate - Solo ejecutar migraciones")
    console.log("   npm run db:seed    - Solo ejecutar seeders")
    console.log("   npm run db:reset   - Resetear completamente")

    console.log("\n🔍 Para verificar en MySQL:")
    console.log(`   USE ${process.env.DB_NAME || "facturacion_db"};`)
    console.log("   SHOW TABLES;")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error configurando la base de datos:", error)
    console.error("💡 Sugerencias:")
    console.error("   1. Verifica que MySQL esté ejecutándose")
    console.error("   2. Verifica las credenciales en el archivo .env")
    console.error("   3. Ejecuta 'npm run db:create' primero si es necesario")
    console.error("   4. Verifica que el usuario tenga permisos para crear bases de datos")
    console.error("   5. Verifica que el puerto MySQL sea el correcto (3306 por defecto)")
    process.exit(1)
  }
}

setupDatabase()
