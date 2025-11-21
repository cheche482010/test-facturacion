require("dotenv").config()
const { User } = require("../models")

const seedUsers = async () => {
  try {
    console.log("   -> Creando usuarios...")

    const userCount = await User.count()
    if (userCount > 0) {
      console.log("     -> Los usuarios ya existen, omitiendo creación.")
      return
    }

    const adminExists = await User.findOne({ where: { username: "admin" } })
    if (!adminExists) {
      await User.create({
        username: "admin",
        email: "admin@sistema.com",
        password: "admin123",
        firstName: "Administrador",
        lastName: "Sistema",
        role: "administrador",
      })
      console.log("     -> Usuario administrador creado.")
    }

    const cajeroExists = await User.findOne({ where: { username: "cajero" } })
    if (!cajeroExists) {
      await User.create({
        username: "cajero",
        email: "cajero@sistema.com",
        password: "cajero123",
        firstName: "Cajero",
        lastName: "Sistema",
        role: "cajero",
      })
      console.log("     -> Usuario cajero creado.")
    }

    const devExists = await User.findOne({ where: { username: "dev" } })
    if (!devExists) {
      await User.create({
        username: "dev",
        email: "dev@sistema.com",
        password: "dev123",
        firstName: "Desarrollador",
        lastName: "Sistema",
        role: "dev",
      })
      console.log("     -> Usuario dev creado.")
    }

    console.log("   -> Usuarios creados exitosamente.")
  } catch (error) {
    console.error("Error creando usuarios:", error)
    throw error
  }
}

module.exports = { seedUsers }

if (require.main === module) {
  seedUsers()
    .then(() => {
      console.log("Seeder de usuarios ejecutado exitosamente.")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Error ejecutando seeder de usuarios:", error)
      process.exit(1)
    })
}