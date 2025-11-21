require("dotenv").config()
const { Sale, SaleItem, SalePayment, Product, User, DolarRate, PaymentMethod, InventoryMovement } = require("../models")
const { sequelize } = require("../connection")
const { Op } = require("sequelize")

const seedSales = async () => {
  try {
    console.log("   -> Creando ventas...")

    const saleCount = await Sale.count()
    if (saleCount > 0) {
      console.log("     -> Las ventas ya existen, omitiendo creación.")
      return
    }

    const transaction = await sequelize.transaction()
    try {
      const adminUser = await User.findOne({ where: { username: "admin" }, transaction })
      const products = await Product.findAll({ where: { currentStock: { [Op.gt]: 0 } }, transaction }).catch(() => [])
      const paymentMethods = await PaymentMethod.findAll({ transaction })
      const dolarRate = await DolarRate.findOne({ order: [['date', 'DESC']], transaction })

      if (!products || products.length === 0) {
        console.log("     -> No hay suficientes productos con stock para crear ventas de ejemplo.")
        await transaction.commit()
        return
      }

      if (products.length < 10) {
        console.log("     -> No hay suficientes productos con stock para crear ventas de ejemplo.")
        await transaction.commit()
        return
      }

      // Crear varias ventas con diferentes métodos de pago
      const salesData = [
        // Venta 1: Efectivo BS
        {
          products: [products[0], products[1]],
          quantities: [1, 1],
          paymentMethods: [{ method: paymentMethods[0], amount: null }] // Efectivo BS, full amount
        },
        // Venta 2: Efectivo USD
        {
          products: [products[2]],
          quantities: [1],
          paymentMethods: [{ method: paymentMethods[1], amount: null }] // Efectivo USD
        },
        // Venta 3: Transferencia
        {
          products: [products[3], products[4]],
          quantities: [2, 1],
          paymentMethods: [{ method: paymentMethods[2], amount: null }] // Transferencia
        },
        // Venta 4: POS
        {
          products: [products[5]],
          quantities: [1],
          paymentMethods: [{ method: paymentMethods[3], amount: null }] // POS
        },
        // Venta 5: Pago Móvil
        {
          products: [products[6], products[7]],
          quantities: [1, 1],
          paymentMethods: [{ method: paymentMethods[4], amount: null }] // Pago Móvil
        },
        // Venta 6: Crédito
        {
          products: [products[8]],
          quantities: [3],
          paymentMethods: [{ method: paymentMethods[5], amount: null }] // Crédito
        },
        // Venta 7: Mixta - Efectivo BS y Transferencia
        {
          products: [products[9], products[10], products[11]],
          quantities: [1, 2, 1],
          paymentMethods: [
            { method: paymentMethods[0], amount: null }, // Efectivo BS, partial
            { method: paymentMethods[2], amount: null }  // Transferencia, partial
          ]
        },
        // Venta 8: Mixta - Efectivo USD y POS
        {
          products: [products[12], products[13]],
          quantities: [1, 1],
          paymentMethods: [
            { method: paymentMethods[1], amount: null }, // Efectivo USD
            { method: paymentMethods[3], amount: null }  // POS
          ]
        },
        // Venta 9: Todos los métodos
        {
          products: [products[14], products[15], products[16], products[17], products[18]],
          quantities: [1, 1, 1, 1, 1],
          paymentMethods: paymentMethods.map(method => ({ method, amount: null }))
        },
        // Venta 10: Otra con múltiples productos
        {
          products: [products[19], products[20], products[21]],
          quantities: [5, 2, 3],
          paymentMethods: [{ method: paymentMethods[0], amount: null }]
        }
      ]

      let saleNumber = 1
      for (const saleInfo of salesData) {
        const saleProducts = saleInfo.products
        const quantities = saleInfo.quantities

        const totalUsd = saleProducts.reduce((sum, product, index) => 
          sum + (Number(product.retailPrice) * quantities[index]), 0)
        const totalBs = totalUsd * 36.5

        const sale = await Sale.create({
          saleNumber: `BODEGA-${String(saleNumber).padStart(4, '0')}`,
          userId: adminUser.id,
          totalUsd: totalUsd,
          totalBs: totalBs,
          dolarRateId: dolarRate.id,
          status: "completada",
          saleDate: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30))),
        }, { transaction })

        // Crear items de venta
        const saleItems = saleProducts.map((product, index) => ({
          saleId: sale.id,
          productId: product.id,
          quantity: quantities[index],
          unitPriceBs: product.retailPrice * 36.5,
          subtotalBs: product.retailPrice * 36.5 * quantities[index],
        }))
        await SaleItem.bulkCreate(saleItems, { transaction })

        // Crear pagos
        const totalAmount = totalBs
        const numPayments = saleInfo.paymentMethods.length
        const amountPerPayment = totalAmount / numPayments

        const salePayments = saleInfo.paymentMethods.map((pm, index) => ({
          saleId: sale.id,
          paymentMethodId: pm.method.id,
          amount: pm.amount || (index === numPayments - 1 ? totalAmount - (amountPerPayment * (numPayments - 1)) : amountPerPayment),
        }))
        await SalePayment.bulkCreate(salePayments, { transaction })

        // Actualizar stock y movimientos
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

      console.log(`     -> ${salesData.length} ventas creadas con métodos de pago variados.`)

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