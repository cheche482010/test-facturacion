require("dotenv").config()
const { DolarRate } = require("../models")

const seedDolarRates = async () => {
  try {
    console.log("   -> Creando tasas de dólar...")

    const dolarRateCount = await DolarRate.count()
    if (dolarRateCount > 0) {
      console.log("     -> Las tasas de dólar ya existen, omitiendo creación.")
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const datesToCreate = [
      today,
      '2025-10-24', 
      '2025-10-27', 
      '2025-10-29'  
    ]

    for (const dateStr of datesToCreate) {
      let dolarRate = await DolarRate.findOne({ where: { date: dateStr } })
      if (!dolarRate) {
        try {
          dolarRate = await DolarRate.create({
            rate: 36.5,
            date: dateStr,
            source: "manual",
          })
          console.log(`     -> Tasa de dólar creada para ${dateStr}.`)
        } catch (error) {
          console.log(`     -> Tasa de dólar ya existe para ${dateStr}.`)
        }
      }
    }

    console.log("   -> Tasas de dólar creadas exitosamente.")
  } catch (error) {
    console.error("Error creando tasas de dólar:", error)
    throw error
  }
}

module.exports = { seedDolarRates }

if (require.main === module) {
  seedDolarRates()
    .then(() => {
      console.log("Seeder de tasas de dólar ejecutado exitosamente.")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Error ejecutando seeder de tasas de dólar:", error)
      process.exit(1)
    })
}