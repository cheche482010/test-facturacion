const express = require("express")
const cors = require("cors")
const path = require("path")

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") })

const authRoutes = require("./routes/auth")
const productRoutes = require("./routes/products")
const categoryRoutes = require("./routes/categories")
const salesRoutes = require("./routes/sales")
const paymentMethodsRoutes = require("./routes/paymentMethods")
const inventoryRoutes = require("./routes/inventory")
const reportRoutes = require("./routes/reports")
const usersRoutes = require("./routes/users")
const currencyRoutes = require("./routes/currency")
const cashReconciliationRoutes = require("./routes/cashReconciliation")
const settingsRoutes = require("./routes/settings")

const { initializeDatabase } = require("./database/connection")

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const uploadsDir = path.resolve(__dirname, "../../uploads")
app.use("/uploads", express.static(uploadsDir))

app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/sales", salesRoutes)
app.use("/api/payment-methods", paymentMethodsRoutes)
app.use("/api/inventory", inventoryRoutes)
app.use("/api/reports", reportRoutes)
app.use("/api/users", usersRoutes)
app.use("/api/currency", currencyRoutes)
app.use("/api/cash-reconciliation", cashReconciliationRoutes)
app.use("/api/settings", settingsRoutes)

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Servidor funcionando correctamente" })
})

let server

const startServer = async () => {
  try {
    await initializeDatabase()
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
