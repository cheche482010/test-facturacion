const express = require("express")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

// Importar rutas
const authRoutes = require("./routes/auth")
const productRoutes = require("./routes/products")
const categoryRoutes = require("./routes/categories")
const customerRoutes = require("./routes/customers")
const salesRoutes = require("./routes/sales")
const inventoryRoutes = require("./routes/inventory")
const reportRoutes = require("./routes/reports")
const usersRoutes = require("./routes/users")

// Importar base de datos
const { initializeDatabase } = require("./database/connection")

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rutas API
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/customers", customerRoutes)
app.use("/api/sales", salesRoutes)
app.use("/api/inventory", inventoryRoutes)
app.use("/api/reports", reportRoutes)
app.use("/api/users", usersRoutes)

// Ruta de salud
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Servidor funcionando correctamente" })
})

let server

const startServer = async () => {
  try {
    await initializeDatabase()

    // Iniciar servidor
    server = app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en puerto ${PORT}`)
    })
  } catch (error) {
    console.error("Error al iniciar el servidor:", error)
  }
}

const stopServer = () => {
  if (server) {
    server.close()
  }
}

module.exports = { startServer, stopServer }
