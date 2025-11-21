require("dotenv").config()
const { CashReconciliation, Sale, SalePayment, PaymentMethod } = require("../models")
const { sequelize } = require("../connection")
const { Op } = require("sequelize")

const seedCashReconciliations = async () => {
  try {
    console.log("   -> Creando arqueos de caja...")

    const cashReconciliationCount = await CashReconciliation.count()
    if (cashReconciliationCount > 0) {
      console.log("     -> Los arqueos de caja ya existen, omitiendo creación.")
      return
    }

    if (cashReconciliationCount === 0) {
      // Crear 5 arqueos de caja para diferentes fechas
      const dates = [
        new Date(new Date().setDate(new Date().getDate() - 5)),
        new Date(new Date().setDate(new Date().getDate() - 4)),
        new Date(new Date().setDate(new Date().getDate() - 3)),
        new Date(new Date().setDate(new Date().getDate() - 2)),
        new Date(new Date().setDate(new Date().getDate() - 1)),
      ]

      for (const date of dates) {
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 0, 0)
        const endOfDay = new Date(startOfDay)
        endOfDay.setDate(endOfDay.getDate() + 1)

        // Obtener ventas del día
        const daySales = await Sale.findAll({
          where: {
            sale_date: { [Op.between]: [startOfDay, endOfDay] },
            status: "completada"
          },
          include: [{
            model: SalePayment,
            as: 'payments',
            include: [{
              model: PaymentMethod,
              as: 'paymentMethod'
            }]
          }]
        })

        if (daySales.length > 0) {
          // Calcular totales por método de pago
          const paymentTotals = {}
          let totalCashBs = 0
          let totalCashUsd = 0

          for (const sale of daySales) {
            for (const payment of sale.payments) {
              const methodName = payment.paymentMethod.name
              if (!paymentTotals[methodName]) {
                paymentTotals[methodName] = 0
              }
              paymentTotals[methodName] += parseFloat(payment.amount)

              if (methodName === 'Efectivo BS') {
                totalCashBs += parseFloat(payment.amount)
              } else if (methodName === 'Efectivo USD') {
                totalCashUsd += parseFloat(payment.amount)
              }
            }
          }

          // Crear arqueo
          await CashReconciliation.create({
            date: startOfDay,
            totalSales: daySales.length,
            totalAmountBs: daySales.reduce((sum, sale) => sum + parseFloat(sale.totalBs), 0),
            totalAmountUsd: daySales.reduce((sum, sale) => sum + parseFloat(sale.totalUsd), 0),
            cashBsCounted: totalCashBs,
            cashUsdCounted: totalCashUsd,
            differenceBs: 0, // Asumir que coincide
            differenceUsd: 0,
            notes: `Arqueo automático para ${startOfDay.toISOString().split('T')[0]}`,
            status: 'completado',
            paymentMethodBreakdown: JSON.stringify(paymentTotals)
          })

          console.log(`     -> Arqueo creado para ${startOfDay.toISOString().split('T')[0]}.`)
        }
      }
    }

    console.log("   -> Arqueos de caja creados exitosamente.")
  } catch (error) {
    console.error("Error creando arqueos de caja:", error)
    throw error
  }
}

module.exports = { seedCashReconciliations }

if (require.main === module) {
  seedCashReconciliations()
    .then(() => {
      console.log("Seeder de arqueos de caja ejecutado exitosamente.")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Error ejecutando seeder de arqueos de caja:", error)
      process.exit(1)
    })
}