const { Sale, SaleItem, SalePayment, PaymentMethod, Product, User, InventoryMovement, sequelize } = require("../database/models")
const { Op } = require("sequelize")

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
    const transaction = await sequelize.transaction()

    try {
      const {
        items,
        payments,
        exchangeRate,
      } = req.body

      if (!items || items.length === 0) {
        return res.status(400).json({ error: "La venta debe tener al menos un producto." });
      }

      if (!payments || payments.length === 0) {
        return res.status(400).json({ error: "La venta debe tener al menos un método de pago." });
      }

      if (!exchangeRate) {
        return res.status(400).json({ error: "La tasa de cambio es requerida." });
      }

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
          subtotalUsd: 0,
          subtotalBs: 0,
          totalUsd: 0,
          totalBs: 0,
          exchangeRate,
          paymentStatus: "pagado",
          paidAmountBs: 0,
          paidAmountUsd: 0,
          changeAmountBs: 0,
          changeAmountUsd: 0,
          status: "completada",
          notes: "",
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

        const itemUnitPriceUsd = product.retailPrice;
        const itemUnitPriceBs = itemUnitPriceUsd * exchangeRate;
        const itemSubtotalUsd = itemUnitPriceUsd * item.quantity;
        const itemSubtotalBs = itemSubtotalUsd * exchangeRate;
        const itemTotalUsd = itemSubtotalUsd;
        const itemTotalBs = itemSubtotalBs;

        calculatedSubtotalUsd += itemSubtotalUsd;
        calculatedSubtotalBs += itemSubtotalBs;
        calculatedTotalUsd += itemTotalUsd;
        calculatedTotalBs += itemTotalBs;

        await SaleItem.create(
          {
            saleId: sale.id,
            productId: product.id,
            quantity: item.quantity,
            unitPriceUsd: itemUnitPriceUsd,
            unitPriceBs: itemUnitPriceBs,
            subtotalUsd: itemSubtotalUsd,
            subtotalBs: itemSubtotalBs,
            totalUsd: itemTotalUsd,
            totalBs: itemTotalBs,
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
      let totalPaidBs = 0;
      let totalPaidUsd = 0;

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
          },
          { transaction },
        );

        // Asumir que si el método contiene "usd" es en USD, sino en BS
        if (paymentMethod.name.toLowerCase().includes('usd')) {
          totalPaidUsd += payment.amount;
        } else {
          totalPaidBs += payment.amount;
        }
      }

      const changeBs = totalPaidBs - calculatedTotalBs;
      const changeUsd = totalPaidUsd - calculatedTotalUsd;

      await sale.update({
        subtotalUsd: calculatedSubtotalUsd,
        subtotalBs: calculatedSubtotalBs,
        totalUsd: calculatedTotalUsd,
        totalBs: calculatedTotalBs,
        paidAmountBs: totalPaidBs,
        paidAmountUsd: totalPaidUsd,
        changeAmountBs: Math.max(0, changeBs),
        changeAmountUsd: Math.max(0, changeUsd),
      }, { transaction });

      await transaction.commit()

      const completeSale = await Sale.findByPk(sale.id, {
        include: [
          { model: User, as: "user", attributes: ["id", "firstName", "lastName"] },
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
    const transaction = await sequelize.transaction()

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

      const updatedSale = await Sale.findByPk(sale.id, {
        include: [
          { model: User, as: "user", attributes: ["id", "firstName", "lastName"] },
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