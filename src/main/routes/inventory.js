const express = require("express")
const { InventoryMovement, Product, User, Category, sequelize } = require("../database/models")
const { Op } = require("sequelize")

const router = express.Router()

// Obtener movimientos de inventario
router.get("/movements", async (req, res) => {
  try {
    const { productId, startDate, endDate, movementType, limit = 100 } = req.query

    const whereClause = {}

    if (productId) {
      whereClause.productId = productId
    }

    if (startDate && endDate) {
      whereClause.movementDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      }
    }

    if (movementType) {
      whereClause.movementType = movementType
    }

    const movements = await InventoryMovement.findAll({
      where: whereClause,
      include: [
        { model: Product, as: "product" },
        { model: User, as: "user", attributes: ["id", "firstName", "lastName"] },
      ],
      order: [["movementDate", "DESC"]],
      limit: Number.parseInt(limit),
    })

    res.json(movements)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Obtener movimientos por producto
router.get("/movements/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params
    const { limit = 50 } = req.query

    const movements = await InventoryMovement.findAll({
      where: { productId },
      include: [
        { model: Product, as: "product" },
        { model: User, as: "user", attributes: ["id", "firstName", "lastName"] },
      ],
      order: [["movementDate", "DESC"]],
      limit: Number.parseInt(limit),
    })

    res.json(movements)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Ajustar stock
router.post("/adjust-stock", async (req, res) => {
  const transaction = await sequelize.transaction()

  try {
    const { productId, newStock, reason, notes } = req.body

    const product = await Product.findByPk(productId, { transaction })
    if (!product) {
      await transaction.rollback()
      return res.status(404).json({ error: "Producto no encontrado" })
    }

    const previousStock = product.currentStock
    const quantity = Math.abs(newStock - previousStock)
    const movementType = newStock > previousStock ? "entrada" : "salida"

    // Actualizar stock del producto
    await product.update({ currentStock: newStock }, { transaction })

    // Crear movimiento de inventario
    const movement = await InventoryMovement.create(
      {
        productId,
        userId: req.user?.id || 1, // TODO: Obtener del token JWT
        movementType: movementType,
        reason: reason || "ajuste_inventario",
        quantity,
        previousStock,
        newStock,
        unitCost: product.costPrice,
        totalCost: product.costPrice * quantity,
        notes: notes || "Ajuste manual de inventario",
      },
      { transaction },
    )

    await transaction.commit()

    const movementWithIncludes = await InventoryMovement.findByPk(movement.id, {
      include: [
        { model: Product, as: "product" },
        { model: User, as: "user", attributes: ["id", "firstName", "lastName"] },
      ],
    })

    res.json({
      message: "Stock ajustado correctamente",
      product,
      movement: movementWithIncludes,
    })
  } catch (error) {
    await transaction.rollback()
    res.status(500).json({ error: error.message })
  }
})

// Ajuste masivo
router.post("/mass-adjustment", async (req, res) => {
  const transaction = await sequelize.transaction()

  try {
    const { category, adjustmentType, adjustmentValue, reason, notes } = req.body

    const whereClause = {}
    if (category) {
      whereClause.categoryId = category
    }

    const products = await Product.findAll({
      where: whereClause,
      transaction,
    })

    const movements = []

    for (const product of products) {
      let newStock = product.currentStock

      switch (adjustmentType) {
        case "fixed":
          newStock = Math.max(0, product.currentStock + adjustmentValue)
          break
        case "percentage":
          newStock = Math.max(0, Math.round(product.currentStock * (1 + adjustmentValue / 100)))
          break
        case "zero":
          newStock = 0
          break
      }

      if (newStock !== product.currentStock) {
        const previousStock = product.currentStock
        const quantity = Math.abs(newStock - previousStock)
        const movementType = newStock > previousStock ? "entrada" : "salida"

        // Actualizar stock
        await product.update({ currentStock: newStock }, { transaction })

        // Crear movimiento
        const movement = await InventoryMovement.create(
          {
            productId: product.id,
            userId: req.user?.id || 1,
            movementType,
            reason: reason || "ajuste_masivo",
            quantity,
            previousStock,
            newStock,
            unitCost: product.costPrice,
            totalCost: product.costPrice * quantity,
            notes: notes || "Ajuste masivo de inventario",
          },
          { transaction },
        )

        movements.push(movement)
      }
    }

    await transaction.commit()

    res.json({
      message: `Ajuste masivo aplicado a ${movements.length} productos`,
      movements,
    })
  } catch (error) {
    await transaction.rollback()
    res.status(500).json({ error: error.message })
  }
})

// Reporte de inventario
router.get("/report", async (req, res) => {
  try {
    const { category, stockFilter, includeValue = true } = req.query

    const whereClause = {}
    if (category) {
      whereClause.categoryId = category
    }

    let products = await Product.findAll({
      where: whereClause,
      include: [{ model: Category, as: "category" }],
      order: [["name", "ASC"]],
    })

    // Aplicar filtros de stock
    if (stockFilter) {
      switch (stockFilter) {
        case "low":
          products = products.filter((p) => p.currentStock <= p.minStock && p.currentStock > 0)
          break
        case "empty":
          products = products.filter((p) => p.currentStock === 0)
          break
        case "normal":
          products = products.filter((p) => p.currentStock > p.minStock && p.currentStock <= p.maxStock)
          break
        case "over":
          products = products.filter((p) => p.currentStock > p.maxStock)
          break
      }
    }

    // Calcular totales
    const totalProducts = products.length
    const totalValue = includeValue ? products.reduce((sum, p) => sum + p.currentStock * p.costPrice, 0) : 0

    const summary = {
      totalProducts,
      totalValue,
      inStock: products.filter((p) => p.currentStock > 0).length,
      lowStock: products.filter((p) => p.currentStock <= p.minStock && p.currentStock > 0).length,
      outOfStock: products.filter((p) => p.currentStock === 0).length,
    }

    res.json({
      summary,
      products,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Alertas de stock
router.get("/alerts", async (req, res) => {
  try {
    const lowStockProducts = await Product.findAll({
      where: {
        [Op.or]: [{ currentStock: { [Op.lte]: sequelize.col("min_stock") } }, { currentStock: 0 }],
      },
      include: [{ model: Category, as: "category" }],
      order: [["currentStock", "ASC"]],
    })

    const alerts = lowStockProducts.map((product) => ({
      id: product.id,
      name: product.name,
      currentStock: product.currentStock,
      minStock: product.minStock,
      unit: product.unit,
      category: product.category?.name,
      type: product.currentStock === 0 ? "out_of_stock" : "low_stock",
      severity: product.currentStock === 0 ? "high" : "medium",
    }))

    res.json(alerts)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
