const { Sale, SaleItem, SalePayment, PaymentMethod, Product, User, InventoryMovement, CashReconciliation, DolarRate } = require("../database/models")
const { Op } = require("sequelize")
const CashReconciliationService = require("../services/CashReconciliationService")

const salesController = {
  async getAll(req, res) {
    try {
      const { startDate, endDate, status, limit = 50 } = req.query
      const whereClause = {}

      if (startDate && endDate) {
        whereClause.saleDate = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        }
      }

      if (status) whereClause.status = status

      const sales = await Sale.findAll({
        where: whereClause,
        include: [
          { model: User, as: "user", attributes: ["id", "firstName", "lastName"] },
          {
            model: SaleItem,
            as: "items",
            include: [{ model: Product, as: "product" }],
          },
        ],
        order: [["saleDate", "DESC"]],
        limit: Number.parseInt(limit),
      })

      res.json(sales)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async create(req, res) {
    const transaction = await Sale.sequelize.transaction()

    try {
      const {
        items,
        payments,
        notes,
      } = req.body

      if (!items || items.length === 0) {
        return res.status(400).json({ error: "La venta debe tener al menos un producto." });
      }

      if (!payments || payments.length === 0) {
        return res.status(400).json({ error: "La venta debe tener al menos un método de pago." });
      }

      // Obtener la tasa de cambio del día actual
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const dolarRate = await DolarRate.findOne({
        where: { date: today },
        transaction
      })

      if (!dolarRate) {
        throw new Error(`No se encontró la tasa de cambio para la fecha ${today}`)
      }

      const exchangeRate = dolarRate.rate

      let calculatedSubtotalUsd = 0;
      let calculatedSubtotalBs = 0;
      let calculatedTotalUsd = 0;
      let calculatedTotalBs = 0;

      const saleCount = await Sale.count({ transaction })
      const saleNumber = `BODEGA-${String(saleCount + 1).padStart(6, "0")}`

      const sale = await Sale.create(
        {
          saleNumber,
          userId: req.user?.id || 1,
          totalUsd: 0,
          totalBs: 0,
          dolarRateId: dolarRate.id,
          paymentStatus: "pagado",
          status: "completada",
          notes: notes || "",
        },
        { transaction },
      )

      for (const item of items) {
        const product = await Product.findByPk(item.productId, { transaction, lock: true })

        if (!product) {
          throw new Error(`Producto con ID ${item.productId} no encontrado`)
        }

        if (product.currentStock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.currentStock}`)
        }

        const itemUnitPriceBs = product.retailPrice * exchangeRate;
        const itemSubtotalBs = itemUnitPriceBs * item.quantity;

        calculatedSubtotalUsd += (itemSubtotalBs / exchangeRate);
        calculatedSubtotalBs += itemSubtotalBs;
        calculatedTotalUsd += (itemSubtotalBs / exchangeRate);
        calculatedTotalBs += itemSubtotalBs;

        await SaleItem.create(
          {
            saleId: sale.id,
            productId: product.id,
            quantity: item.quantity,
            unitPriceBs: itemUnitPriceBs,
            subtotalBs: itemSubtotalBs,
          },
          { transaction },
        )

        const newStock = product.currentStock - item.quantity
        await product.update({ currentStock: newStock }, { transaction });

        await InventoryMovement.create(
          {
            productId: product.id,
            userId: req.user?.id || 1,
            movementType: "salida",
            reason: "venta",
            quantity: item.quantity,
            previousStock: product.currentStock,
            newStock: newStock,
            unitCost: product.costPrice,
            totalCost: product.costPrice * item.quantity,
            referenceId: sale.id,
            referenceType: "sale",
            notes: `Venta ${saleNumber}`,
          },
          { transaction },
        )
      }

      // Crear pagos
      for (const payment of payments) {
        const paymentMethod = await PaymentMethod.findByPk(payment.paymentMethodId, { transaction });
        if (!paymentMethod) {
          throw new Error(`Método de pago con ID ${payment.paymentMethodId} no encontrado`);
        }

        await SalePayment.create(
          {
            saleId: sale.id,
            paymentMethodId: payment.paymentMethodId,
            amount: payment.amount,
            reference: payment.reference || null,
            notes: payment.notes || null,
          },
          { transaction },
        );
      }

      await sale.update({
        totalUsd: calculatedTotalUsd,
        totalBs: calculatedTotalBs,
      }, { transaction });

      await transaction.commit()

      try {
        const todayReconciliation = await CashReconciliationService.getTodayReconciliation()
        if (todayReconciliation) {
          const currentTotalSales = todayReconciliation.totalSales || 0
          const newTotalSales = currentTotalSales + calculatedTotalBs

          await CashReconciliation.update(
            { totalSales: newTotalSales },
            { where: { id: todayReconciliation.id } }
          )
        }
      } catch (error) {
        console.error('Error updating cash reconciliation:', error)
      }

      const completeSale = await Sale.findByPk(sale.id, {
        include: [
          { model: User, as: "user", attributes: ["id", "firstName", "lastName"] },
          { model: DolarRate, as: "dolarRate" },
          {
            model: SaleItem,
            as: "items",
            include: [{ model: Product, as: "product" }],
          },
          {
            model: SalePayment,
            as: "payments",
            include: [{ model: PaymentMethod, as: "paymentMethod" }],
          },
        ],
      })

      res.status(201).json(completeSale)
    } catch (error) {
      await transaction.rollback()
      res.status(500).json({ error: error.message })
    }
  },

  async getById(req, res) {
    try {
      const sale = await Sale.findByPk(req.params.id, {
        include: [
          { model: User, as: "user", attributes: ["id", "firstName", "lastName"] },
          { model: DolarRate, as: "dolarRate" },
          {
            model: SaleItem,
            as: "items",
            include: [{ model: Product, as: "product" }],
          },
          {
            model: SalePayment,
            as: "payments",
            include: [{ model: PaymentMethod, as: "paymentMethod" }],
          },
        ],
      })

      if (!sale) {
        return res.status(404).json({ error: "Venta no encontrada" })
      }

      res.json(sale)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async cancel(req, res) {
    const transaction = await Sale.sequelize.transaction()

    try {
      const { reason } = req.body
      const sale = await Sale.findByPk(req.params.id, {
        include: [{ model: SaleItem, as: "items" }],
        transaction,
      })

      if (!sale) {
        await transaction.rollback()
        return res.status(404).json({ error: "Venta no encontrada" })
      }

      if (sale.status === "cancelada") {
        await transaction.rollback()
        return res.status(400).json({ error: "La venta ya está cancelada" })
      }

      for (const item of sale.items) {
        const product = await Product.findByPk(item.productId, { transaction })
        const newStock = product.currentStock + item.quantity

        await product.update({ currentStock: newStock }, { transaction })

        await InventoryMovement.create(
          {
            productId: item.productId,
            userId: req.user?.id || 1,
            movementType: "entrada",
            reason: "devolucion_cliente",
            quantity: item.quantity,
            previousStock: product.currentStock,
            newStock: newStock,
            unitCost: product.costPrice,
            totalCost: product.costPrice * item.quantity,
            referenceId: sale.id,
            referenceType: "sale_cancellation",
            notes: `Cancelación de venta ${sale.saleNumber}: ${reason}`,
          },
          { transaction },
        )
      }

      await sale.update(
        {
          status: "cancelada",
          notes: `${sale.notes || ""}\nCancelada: ${reason}`,
        },
        { transaction },
      )

      await transaction.commit()

      try {
        const todayReconciliation = await CashReconciliationService.getTodayReconciliation()
        if (todayReconciliation) {
          const currentTotalSales = todayReconciliation.totalSales || 0
          const newTotalSales = Math.max(0, currentTotalSales - parseFloat(sale.totalBs))

          await CashReconciliation.update(
            { totalSales: newTotalSales },
            { where: { id: todayReconciliation.id } }
          )
        }
      } catch (error) {
        console.error('Error updating cash reconciliation on cancellation:', error)
      }

      const updatedSale = await Sale.findByPk(sale.id, {
        include: [
          { model: User, as: "user", attributes: ["id", "firstName", "lastName"] },
          { model: DolarRate, as: "dolarRate" },
          {
            model: SaleItem,
            as: "items",
            include: [{ model: Product, as: "product" }],
          },
          {
            model: SalePayment,
            as: "payments",
            include: [{ model: PaymentMethod, as: "paymentMethod" }],
          },
        ],
      })

      res.json(updatedSale)
    } catch (error) {
      await transaction.rollback()
      res.status(500).json({ error: error.message })
    }
  },

  async getInvoice(req, res) {
    try {
      const { format = "json" } = req.query
      const sale = await Sale.findByPk(req.params.id, {
        include: [
          { model: User, as: "user", attributes: ["id", "firstName", "lastName"] },
          { model: DolarRate, as: "dolarRate" },
          {
            model: SaleItem,
            as: "items",
            include: [{ model: Product, as: "product" }],
          },
          {
            model: SalePayment,
            as: "payments",
            include: [{ model: PaymentMethod, as: "paymentMethod" }],
          },
        ],
      })

      if (!sale) {
        return res.status(404).json({ error: "Venta no encontrada" })
      }

      if (format === "pdf") {
        res.status(501).json({ error: "Generación de PDF no implementada aún" })
      } else {
        res.json({
          sale,
          company: {
            name: "Mi Empresa",
            rif: "J-12345678-9",
            address: "Dirección de la empresa",
            phone: "0212-1234567",
          },
          generatedAt: new Date(),
        })
      }
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}

module.exports = salesController