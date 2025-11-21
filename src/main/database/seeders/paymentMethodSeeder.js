require("dotenv").config()
const { PaymentMethod } = require("../models")

const seedPaymentMethods = async () => {
  try {
    console.log("   -> Creando métodos de pago...")

    const paymentMethodCount = await PaymentMethod.count()
    if (paymentMethodCount > 0) {
      console.log("     -> Los métodos de pago ya existen, omitiendo creación.")
      return
    }

    const paymentMethodsExist = await PaymentMethod.count()
    if (paymentMethodsExist === 0) {
      const paymentMethods = [
        { name: "Efectivo BS", description: "Pago en efectivo en bolívares" },
        { name: "Efectivo USD", description: "Pago en efectivo en dólares" },
        { name: "Transferencia", description: "Pago por transferencia bancaria" },
        { name: "POS", description: "Pago con tarjeta de débito/crédito" },
        { name: "Pago Móvil", description: "Pago móvil" },
        { name: "Crédito", description: "Pago a crédito" },
      ]

      await PaymentMethod.bulkCreate(paymentMethods)
      console.log("     -> Métodos de pago por defecto creados.")
    }

    console.log("   -> Métodos de pago creados exitosamente.")
  } catch (error) {
    console.error("Error creando métodos de pago:", error)
    throw error
  }
}

module.exports = { seedPaymentMethods }

if (require.main === module) {
  seedPaymentMethods()
    .then(() => {
      console.log("Seeder de métodos de pago ejecutado exitosamente.")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Error ejecutando seeder de métodos de pago:", error)
      process.exit(1)
    })
}