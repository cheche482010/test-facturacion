const express = require("express")
const { Category } = require("../database/models")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Todas las rutas de categorías requieren autenticación
router.use(authenticateToken)

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

router.post("/", async (req, res) => {
  try {
    const category = await Category.create(req.body)
    res.status(201).json(category)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

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
