const { Product, Category, InventoryMovement } = require("../database/models")
const { Op } = require("sequelize")

const productsController = {
  async getAll(req, res) {
    try {
      const { search, category, status, stockFilter } = req.query
      const whereClause = {}

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { internalCode: { [Op.like]: `%${search}%` } },
          { barcode: { [Op.like]: `%${search}%` } },
        ]
      }

      if (category) whereClause.categoryId = category
      if (status) whereClause.status = status

      const products = await Product.findAll({
        where: whereClause,
        include: [{ model: Category, as: "category" }],
        order: [["name", "ASC"]],
      })

      res.json(products)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async getById(req, res) {
    try {
      const product = await Product.findByPk(req.params.id, {
        include: [{ model: Category, as: "category" }],
      })

      if (!product) {
        return res.status(404).json({ error: "Producto no encontrado" })
      }

      res.json(product)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async create(req, res) {
    try {
      const product = await Product.create(req.body)

      if (product.currentStock > 0) {
        await InventoryMovement.create({
          productId: product.id,
          userId: req.user?.id || 1,
          movementType: "entrada",
          reason: "inventario_inicial",
          quantity: product.currentStock,
          previousStock: 0,
          newStock: product.currentStock,
          unitCost: product.costPrice,
          totalCost: product.costPrice * product.currentStock,
          notes: "Stock inicial del producto",
        })
      }

      const createdProduct = await Product.findByPk(product.id, {
        include: [{ model: Category, as: "category" }],
      })

      res.status(201).json(createdProduct)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async update(req, res) {
    try {
      const product = await Product.findByPk(req.params.id)

      if (!product) {
        return res.status(404).json({ error: "Producto no encontrado" })
      }

      await product.update(req.body)

      const updatedProduct = await Product.findByPk(req.params.id, {
        include: [{ model: Category, as: "category" }],
      })

      res.json(updatedProduct)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async delete(req, res) {
    try {
      const product = await Product.findByPk(req.params.id)

      if (!product) {
        return res.status(404).json({ error: "Producto no encontrado" })
      }

      await product.destroy()
      res.json({ message: "Producto eliminado correctamente" })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async updateStock(req, res) {
    try {
      const { newStock, movementType, reason, notes } = req.body
      const product = await Product.findByPk(req.params.id)

      if (!product) {
        return res.status(404).json({ error: "Producto no encontrado" })
      }

      const previousStock = product.currentStock
      const quantity = newStock - previousStock

      await product.update({ currentStock: newStock })

      await InventoryMovement.create({
        productId: product.id,
        userId: req.user?.id || 1,
        movementType: quantity > 0 ? "entrada" : "salida",
        reason: reason || "ajuste_inventario",
        quantity: Math.abs(quantity),
        previousStock,
        newStock,
        unitCost: product.costPrice,
        totalCost: product.costPrice * Math.abs(quantity),
        notes: notes || "Ajuste manual de inventario",
      })

      res.json({ message: "Stock actualizado correctamente", product })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}

module.exports = productsController