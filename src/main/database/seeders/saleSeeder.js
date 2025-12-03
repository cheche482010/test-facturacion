require("dotenv").config()
const { Sale, SaleItem, SalePayment, Product, User, DolarRate, PaymentMethod, InventoryMovement, CashReconciliation } = require("../models")
const { sequelize } = require("../connection")
const { Op } = require("sequelize")

const seedSales = async () => {
  try {
    console.log("   -> Creando ventas...")

    const transaction = await sequelize.transaction()
    try {
      const saleCount = await Sale.count({ transaction })
      if (saleCount > 0) {
        console.log("     -> Eliminando ventas existentes para crear datos de prueba...")
        await Product.update({ currentStock: 100 }, { where: {}, transaction })
        console.log("     -> Stock de productos reseteado a 100.")
        await SalePayment.destroy({ where: {}, transaction })
        await SaleItem.destroy({ where: {}, transaction })
        await Sale.destroy({ where: {}, transaction })
        await CashReconciliation.destroy({ where: {}, transaction })
        console.log("     -> Ventas y arqueos existentes eliminados.")
      }

      const adminUser = await User.findOne({ where: { username: "admin" }, transaction })
      const products = await Product.findAll({ where: { currentStock: { [Op.gt]: 0 } }, transaction }).catch(() => [])
      const paymentMethods = await PaymentMethod.findAll({ transaction })
      const dolarRate = await DolarRate.findOne({ order: [['date', 'DESC']], transaction })

      if (!products || products.length === 0) {
        console.log("     -> No hay suficientes productos con stock para crear ventas de ejemplo.")
        await transaction.commit()
        return
      }

      if (products.length < 30) {
        console.log("     -> No hay suficientes productos con stock para crear ventas de ejemplo.")
        await transaction.commit()
        return
      }

      const salesData = []
      const numLotes = 5
      const ventasPorLote = 5

      for (let lote = 0; lote < numLotes; lote++) {
        const loteDate = new Date()
        loteDate.setDate(loteDate.getDate() - (numLotes - lote)) 

        for (let venta = 0; venta < ventasPorLote; venta++) {
          const numProducts = Math.floor(Math.random() * 4) + 2 
          const selectedProducts = []
          const quantities = []

          for (let i = 0; i < numProducts; i++) {
            const randomIndex = Math.floor(Math.random() * products.length)
            selectedProducts.push(products[randomIndex])
            quantities.push(Math.floor(Math.random() * 5) + 1) 
          }

          const numPayments = Math.floor(Math.random() * 2) + 2 
          const selectedMethods = []
          const usedIndices = new Set()

          while (selectedMethods.length < numPayments) {
            const randomIndex = Math.floor(Math.random() * paymentMethods.length)
            if (!usedIndices.has(randomIndex)) {
              selectedMethods.push(paymentMethods[randomIndex])
              usedIndices.add(randomIndex)
            }
          }

          salesData.push({
            products: selectedProducts,
            quantities: quantities,
            paymentMethods: selectedMethods.map(method => ({ method, amount: null })),
            saleDate: loteDate,
            lote: lote + 1
          })
        }
      }

      let saleNumber = 1
      for (const saleInfo of salesData) {
        const saleProducts = saleInfo.products
        const quantities = saleInfo.quantities

        const totalUsd = saleProducts.reduce((sum, product, index) =>
          sum + (Number(product.retailPrice) * quantities[index]), 0)
        const totalBs = totalUsd * 36.5

        const giveChange = Math.random() < 0.3
        let changeGivenBs = 0
        let totalPaid = totalBs

        if (giveChange) {
          changeGivenBs = Math.floor(Math.random() * 16) + 5
          totalPaid = totalBs + changeGivenBs
        }

        const sale = await Sale.create({
          saleNumber: `BODEGA-${String(saleNumber).padStart(4, '0')}`,
          userId: adminUser.id,
          totalUsd: totalUsd,
          totalBs: totalBs,
          dolarRateId: dolarRate.id,
          status: "completada",
          sale_date: saleInfo.saleDate,
          changeGivenBs: changeGivenBs,
        }, { transaction })

        const saleItems = saleProducts.map((product, index) => ({
          saleId: sale.id,
          productId: product.id,
          quantity: quantities[index],
          unitPriceBs: product.retailPrice * 36.5,
          subtotalBs: product.retailPrice * 36.5 * quantities[index],
        }))
        await SaleItem.bulkCreate(saleItems, { transaction })

        const numPayments = saleInfo.paymentMethods.length
        let remainingAmount = totalPaid
        const salePayments = saleInfo.paymentMethods.map((pm, index) => {
          let amount
          if (index === numPayments - 1) {
            amount = remainingAmount
          } else {
            const minAmount = 1
            const maxAmount = remainingAmount - (numPayments - index - 1) * minAmount
            amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount
          }
          remainingAmount -= amount
          return {
            saleId: sale.id,
            paymentMethodId: pm.method.id,
            amount: amount,
          }
        })
        await SalePayment.bulkCreate(salePayments, { transaction })

        for (const item of saleItems) {
          const product = saleProducts.find(p => p.id === item.productId)
          const previousStock = product.currentStock
          const newStock = Math.max(0, previousStock - item.quantity)

          await product.update({ currentStock: newStock }, { transaction })

          await InventoryMovement.create({
            productId: product.id,
            userId: adminUser.id,
            movementType: "salida",
            reason: "venta",
            quantity: item.quantity,
            previousStock: previousStock,
            newStock: newStock,
            unitCost: product.costPrice,
            totalCost: product.costPrice * item.quantity,
            referenceId: sale.id,
            referenceType: "sale",
            notes: `Venta ${sale.saleNumber}`,
            movementDate: sale.saleDate
          }, { transaction })
        }

        saleNumber++
      }

      console.log(`     -> ${salesData.length} ventas creadas en ${numLotes} lotes con métodos de pago variados y cambios incluidos.`)

      console.log("     -> Creando arqueos de caja para cada lote...")
      const loteDates = [...new Set(salesData.map(s => s.saleDate.toISOString().split('T')[0]))]

      for (let loteIndex = 0; loteIndex < loteDates.length; loteIndex++) {
        const loteDateStr = loteDates[loteIndex]
        const loteDate = new Date(loteDateStr)
        const nextDay = new Date(loteDate)
        nextDay.setDate(nextDay.getDate() + 1)

        const loteSales = await Sale.findAll({
          where: sequelize.where(
            sequelize.fn('DATE', sequelize.col('sale_date')),
            '=',
            sequelize.fn('DATE', loteDate)
          ),
          include: [{
            model: SalePayment,
            as: 'payments',
            include: [{
              model: PaymentMethod,
              as: 'paymentMethod'
            }]
          }],
          transaction
        })

        if (loteSales.length > 0) {
          const totalSales = loteSales.reduce((sum, sale) => sum + parseFloat(sale.totalBs), 0)
          const totalSalesUsd = loteSales.reduce((sum, sale) => sum + parseFloat(sale.totalUsd), 0)

          const paymentTotals = {}
          let totalCashBs = 0
          let totalCashUsd = 0

          for (const sale of loteSales) {
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

          const reconciliation = await CashReconciliation.create({
            lote: `LOTE-${loteIndex + 1}`,
            openingDate: loteDate,
            closingDate: nextDay,
            openingBalanceBs: 0, 
            openingBalanceUsd: 0,
            closingBalanceBs: totalCashBs, 
            closingBalanceUsd: totalCashUsd,
            totalSales: totalSales,
            totalSalesUsd: totalSalesUsd,
            userId: adminUser.id,
            notes: `Arqueo automático para lote ${loteDateStr}`,
            paymentMethodBreakdown: JSON.stringify(paymentTotals)
          }, { transaction })
          
          await Sale.update(
            { reconciliationId: reconciliation.id },
            {
              where: sequelize.where(
                sequelize.fn('DATE', sequelize.col('sale_date')),
                '=',
                sequelize.fn('DATE', loteDate)
              ),
              transaction
            }
          )

          console.log(`       -> Arqueo creado para ${loteDateStr} con ${loteSales.length} ventas.`)
        }
      }

      console.log("     -> Arqueos de caja creados y asignados a las ventas.")

      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }

    console.log("   -> Ventas creadas exitosamente.")
  } catch (error) {
    console.error("Error creando ventas:", error)
    throw error
  }
}

module.exports = { seedSales }

if (require.main === module) {
  seedSales()
    .then(() => {
      console.log("Seeder de ventas ejecutado exitosamente.")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Error ejecutando seeder de ventas:", error)
      process.exit(1)
    })
}