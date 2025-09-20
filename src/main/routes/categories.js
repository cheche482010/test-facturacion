const express = require("express")
const { Category } = require("../database/models")

const router = express.Router()

// Obtener todas las categorías
router.get("/", async (req, res) => {
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
})

// Crear categoría
router.post("/", async (req, res) => {
  try {
    const category = await Category.create(req.body)
    res.status(201).json(category)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Actualizar categoría
router.put("/:id", async (req, res) => {
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
})

// Eliminar categoría
router.delete("/:id", async (req, res) => {
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
})

module.exports = router
