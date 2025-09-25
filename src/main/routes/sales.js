const express = require("express")
const { Sale, SaleItem, Product, Customer, User, InventoryMovement, sequelize } = require("../database/models")
const { Op } = require("sequelize")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Todas las rutas de ventas requieren autenticación
router.use(authenticateToken)

router.get("/", async (req, res) => {
  try {
    const { startDate, endDate, customerId, status, limit = 50 } = req.query

    const whereClause = {}

    if (startDate && endDate) {
      whereClause.saleDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      }
    }

    if (customerId) {
      whereClause.customerId = customerId
    }

    if (status) {
      whereClause.status = status
    }

    const sales = await Sale.findAll({
      where: whereClause,
      include: [
        { model: Customer, as: "customer" },
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
})

router.post("/", async (req, res) => {
  const transaction = await sequelize.transaction()

  try {
    const {
      items,
      customerId,
      saleType,
      operationMode,
      subtotal,
      discountAmount,
      discountPercentage,
      taxAmount,
      total,
      payment,
    } = req.body

    // Generar número de venta
    const saleCount = await Sale.count({ transaction })
    const saleNumber = `${operationMode.toUpperCase()}-${String(saleCount + 1).padStart(6, "0")}`

    // Crear la venta
    const sale = await Sale.create(
      {
        saleNumber,
        customerId: customerId || null,
        userId: req.user?.id || 1, // TODO: Obtener del token JWT
        saleType,
        operationMode,
        subtotal,
        taxAmount,
        discountAmount,
        discountPercentage,
        total,
        paymentMethod: payment.method,
        paymentStatus: payment.method === "credito" ? "pendiente" : "pagado",
        paidAmount: payment.paidAmount || total,
        changeAmount: payment.changeAmount || 0,
        documentType: payment.documentType || "ticket",
        status: "completada",
        notes: payment.notes || "",
      },
      { transaction },
    )

    // Crear items de la venta y actualizar inventario
    for (const item of items) {
      // Verificar stock disponible
      const product = await Product.findByPk(item.product.id, { transaction })
      if (!product) {
        throw new Error(`Producto ${item.product.name} no encontrado`)
      }

      if (product.currentStock < item.quantity) {
        throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.currentStock}`)
      }

      // Crear item de venta
      await SaleItem.create(
        {
          saleId: sale.id,
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercentage: item.discountPercentage || 0,
          discountAmount: item.discountAmount || 0,
          taxRate: product.taxRate || 0,
          taxAmount: (item.unitPrice * item.quantity * (product.taxRate || 0)) / 100,
          subtotal: item.unitPrice * item.quantity,
          total: item.unitPrice * item.quantity - (item.discountAmount || 0),
        },
        { transaction },
      )

      // Actualizar stock del producto
      const newStock = product.currentStock - item.quantity
      await product.update({ currentStock: newStock }, { transaction })

      // Crear movimiento de inventario
      await InventoryMovement.create(
        {
          productId: item.product.id,
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

    await transaction.commit()

    // Obtener la venta completa con relaciones
    const completeSale = await Sale.findByPk(sale.id, {
      include: [
        { model: Customer, as: "customer" },
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
})

router.get("/:id", async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: Customer, as: "customer" },
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
})

router.put("/:id/cancel", async (req, res) => {
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

    // Restaurar inventario
    for (const item of sale.items) {
      const product = await Product.findByPk(item.productId, { transaction })
      const newStock = product.currentStock + item.quantity

      await product.update({ currentStock: newStock }, { transaction })

      // Crear movimiento de inventario de devolución
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

    // Actualizar estado de la venta
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
        { model: Customer, as: "customer" },
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
})

router.get("/:id/invoice", async (req, res) => {
  try {
    const { format = "json" } = req.query
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: Customer, as: "customer" },
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
      // TODO: Implementar generación de PDF
      res.status(501).json({ error: "Generación de PDF no implementada aún" })
    } else {
      res.json({
        sale,
        company: {
          name: "Mi Empresa", // TODO: Obtener de configuración
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
})

router.get("/report", async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query

    const whereClause = {}
    if (startDate && endDate) {
      whereClause.saleDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      }
    }

    let dateFormat
    switch (groupBy) {
      case "hour":
        dateFormat = "%Y-%m-%d %H:00:00"
        break
      case "day":
        dateFormat = "%Y-%m-%d"
        break
      case "month":
        dateFormat = "%Y-%m"
        break
      case "year":
        dateFormat = "%Y"
        break
      default:
        dateFormat = "%Y-%m-%d"
    }

    const salesReport = await Sale.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn("DATE_FORMAT", sequelize.col("sale_date"), dateFormat), "period"],
        [sequelize.fn("COUNT", sequelize.col("id")), "totalSales"],
        [sequelize.fn("SUM", sequelize.col("total")), "totalAmount"],
        [sequelize.fn("AVG", sequelize.col("total")), "averageAmount"],
      ],
      group: [sequelize.fn("DATE_FORMAT", sequelize.col("sale_date"), dateFormat)],
      order: [[sequelize.fn("DATE_FORMAT", sequelize.col("sale_date"), dateFormat), "DESC"]],
    })

    res.json(salesReport)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
