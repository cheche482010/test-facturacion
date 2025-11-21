require("dotenv").config()

const { seedUsers } = require('./userSeeder')
const { seedCategories } = require('./categorySeeder')
const { seedPaymentMethods } = require('./paymentMethodSeeder')
const { seedSettings } = require('./settingsSeeder')
const { seedProducts } = require('./productSeeder')
const { seedDolarRates } = require('./dolarRateSeeder')
const { seedSales } = require('./saleSeeder')
const { seedCashReconciliations } = require('./cashReconciliationSeeder')

const runAllSeeders = async () => {
  try {
    console.log("Iniciando seeders...")

    await seedUsers()
    await seedCategories()
    await seedPaymentMethods()
    await seedSettings()
    await seedProducts()
    await seedDolarRates()
    await seedSales()
    await seedCashReconciliations()

    console.log("Todos los seeders ejecutados exitosamente.")
  } catch (error) {
    console.error("Error ejecutando seeders:", error)
    throw error
  }
}

module.exports = { runAllSeeders }

if (require.main === module) {
  runAllSeeders()
    .then(() => {
      console.log("Seeders completados exitosamente.")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Error en seeders:", error)
      process.exit(1)
    })
}