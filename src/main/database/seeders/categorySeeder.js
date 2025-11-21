require("dotenv").config()
const { Category } = require("../models")

const seedCategories = async () => {
  try {
    console.log("   -> Creando categorías...")

    const categoryCount = await Category.count()
    if (categoryCount > 0) {
      console.log("     -> Las categorías ya existen, omitiendo creación.")
      return
    }

    const categoriesExist = await Category.count()
    if (categoriesExist === 0) {
      const categories = [
        { name: "Lácteos", description: "Productos derivados de la leche" },
        { name: "Bebés", description: "Productos para el cuidado de bebés" },
        { name: "Limpieza", description: "Productos para la limpieza del hogar" },
        { name: "Aseo Personal", description: "Productos de higiene y cuidado personal" },
        { name: "Víveres", description: "Alimentos no perecederos y de consumo básico" },
        { name: "Hogar", description: "Artículos para el hogar" },
        { name: "Verduras", description: "Hortalizas y verduras frescas" },
        { name: "Granos", description: "Granos y legumbres" },
        { name: "Pastas", description: "Pastas alimenticias" },
        { name: "Enlatados", description: "Alimentos enlatados y conservas" },
        { name: "Aceites", description: "Aceites comestibles" },
        { name: "Cereales", description: "Cereales para el desayuno y otros" },
        { name: "Panadería", description: "Productos de panadería y repostería" },
        { name: "Confitería", description: "Dulces, chocolates y golosinas" },
        { name: "Salsas", description: "Salsas y aderezos" },
        { name: "Bebidas", description: "Jugos, refrescos y otras bebidas" },
        { name: "Embutidos", description: "Embutidos y charcutería" },
        { name: "Huevos", description: "Huevos de gallina y otros" },
        { name: "Pizzas", description: "Pizzas y productos relacionados" },
        { name: "Medicinal", description: "Productos de uso medicinal natural" },
      ]

      await Category.bulkCreate(categories)
      console.log("     -> Categorías por defecto creadas.")
    }

    console.log("   -> Categorías creadas exitosamente.")
  } catch (error) {
    console.error("Error creando categorías:", error)
    throw error
  }
}

module.exports = { seedCategories }

if (require.main === module) {
  seedCategories()
    .then(() => {
      console.log("Seeder de categorías ejecutado exitosamente.")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Error ejecutando seeder de categorías:", error)
      process.exit(1)
    })
}