const { Sale, SaleItem, Product, User, InventoryMovement, sequelize } = require("../database/models")
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
        saleType,
        payment,
      } = req.body

      if (!items || items.length === 0) {
        return res.status(400).json({ error: "La venta debe tener al menos un producto." });
      }

      let calculatedSubtotal = 0;
      let calculatedTaxAmount = 0;
      let calculatedTotal = 0;

      const saleCount = await Sale.count({ transaction })
      const saleNumber = `BODEGA-${String(saleCount + 1).padStart(6, "0")}`

      const sale = await Sale.create(
        {
          saleNumber,
          userId: req.user?.id || 1,
          saleType,
          subtotal: 0,
          taxAmount: 0,
          discountAmount: 0,
          discountPercentage: 0,
          total: 0,
          paymentMethod: payment.method,
          paymentStatus: payment.method === "credito" ? "pendiente" : "pagado",
          paidAmount: payment.paidAmount || 0,
          changeAmount: payment.changeAmount || 0,
          documentType: payment.documentType || "ticket",
          status: "completada",
          notes: payment.notes || "",
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

        const itemSubtotal = product.retailPrice * item.quantity;
        const itemTaxAmount = (itemSubtotal * (product.taxRate || 0)) / 100;
        const itemTotal = itemSubtotal;

        calculatedSubtotal += itemSubtotal;
        calculatedTaxAmount += itemTaxAmount;
        calculatedTotal += itemTotal;

        await SaleItem.create(
          {
            saleId: sale.id,
            productId: product.id,
            quantity: item.quantity,
            unitPrice: product.retailPrice,
            discountPercentage: 0,
            discountAmount: 0,
            taxRate: product.taxRate || 0,
            taxAmount: itemTaxAmount,
            subtotal: itemSubtotal,
            total: itemTotal,
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

      await sale.update({
        subtotal: calculatedSubtotal,
        taxAmount: calculatedTaxAmount,
        total: calculatedTotal,
        paidAmount: payment.paidAmount || calculatedTotal,
        changeAmount: (payment.paidAmount || 0) - calculatedTotal,
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