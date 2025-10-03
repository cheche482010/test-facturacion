const { Category } = require("../database/models")

const categoriesController = {
  async getAll(req, res) {
    try {
      const categories = await Category.findAll({
        include: [
          { model: Category, as: "parent" },
          { model: Category, as: "children" },
        ],
        order: [["name", "ASC"]],
      })
      res.json(categories)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async create(req, res) {
    try {
      const category = await Category.create(req.body)
      res.status(201).json(category)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async update(req, res) {
    try {
      const category = await Category.findByPk(req.params.id)

      if (!category) {
        return res.status(404).json({ error: "Categoría no encontrada" })
      }

      await category.update(req.body)
      res.json(category)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async delete(req, res) {
    try {
      const category = await Category.findByPk(req.params.id)

      if (!category) {
        return res.status(404).json({ error: "Categoría no encontrada" })
      }

      await category.destroy()
      res.json({ message: "Categoría eliminada correctamente" })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}

module.exports = categoriesController