require("dotenv").config()
const { Product, Category } = require("../models")

const seedProducts = async () => {
  try {
    console.log("   -> Creando productos...")

    const productCount = await Product.count()
    if (productCount > 0) {
      console.log("     -> Los productos ya existen, omitiendo creación.")
      return
    }

    if (productCount === 0) {
      const categories = await Category.findAll()
      const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.name.toLowerCase()] = cat.id
        return acc
      }, {})

      const getCategoryId = (tags) => {
        const tagMap = {
          lactios: "lácteos", bebe: "bebés", limpieza: "limpieza", jabon: "limpieza", aseo: "aseo personal",
          viveres: "víveres", toallas: "aseo personal", verdura: "verduras", arroz: "granos",
          harina: "víveres", sardina: "enlatados", enlatado: "enlatados", bombillos: "hogar",
          aceite: "aceites", cereal: "cereales", panes: "panadería", chucherias: "confitería",
          salsas: "salsas", jugo: "bebidas", frutas: "bebidas", lacteos: "lácteos", huevosr: "huevos",
          pizza: "pizzas", medicinal: "medicinal", aluminio: "hogar", cepillo: "hogar",
          refresco: "bebidas", embutidos: "embutidos", velas: "hogar", vinagre: "víveres",
          mayonesa: "salsas", diablito: "enlatados", prestobarba: "aseo personal",
          mostaza: "salsas", pepito: "confitería",
        }
        if (!tags || tags.length === 0) return categoryMap["víveres"]
        const firstTag = tags[0].toLowerCase()
        const mappedCategory = tagMap[firstTag] || firstTag
        return categoryMap[mappedCategory] || categoryMap["víveres"]
      }

      const productsData = [
        { name: "Leche la Campesina 400gr", retailPrice: 2.70, tags: ["bebe"] },
        { name: "Leche Pastoreña Completa 1 Lt", retailPrice: 1.40, tags: ["lactios"] },
        { name: "Leche Valle Hondo 400 Grs", retailPrice: 3.14, tags: ["lactios"] },
        { name: "Jabon Pastilla Las Llaves", retailPrice: 0.83, tags: ["jabon", "limpieza"] },
        { name: "Leche Liquida Guaralact 1.8ml", retailPrice: 2.19, tags: ["lactios"] },
        { name: "Leche Pastoreña Descremada 1 Lt", retailPrice: 1.38, tags: ["prioridad"] },
        { name: "Pañales Pramnpars Talla M", retailPrice: 1.90, tags: ["aseo"] },
        { name: "Toalla sanitaria Allison nocturna", retailPrice: 0.63, tags: [] },
        { name: "CREMA DENTAL MAKSIN MULTI ACTION 90gr", retailPrice: 0.74, tags: ["viveres"] },
        { name: "Toallas Almessy", retailPrice: 0.47, tags: ["toallas", "aseo"] },
        { name: "Toallas Allisson Diurno", retailPrice: 0.71, tags: ["aseo"] },
        { name: "Fideo Nido La Especial 500gr", retailPrice: 0.74, tags: ["viveres"] },
        { name: "LAVAPLATOS CONCORD LIMON 500GR", retailPrice: 1.37, tags: ["viveres"] },
        { name: "arveja amarilla medio kilo", retailPrice: 0.67, tags: ["refuera"] },
        { name: "Harina de Trigo Doña Maria 1Kg", retailPrice: 1.11, tags: ["viveres"] },
        { name: "fororo valle hondo 250g", retailPrice: 0.30, tags: ["sin_existencia"] },
        { name: "ABONO LIQUIDO", retailPrice: 1.37, tags: ["verdura"] },
        { name: "Arvejas Verde Partidas Pesada", retailPrice: 0.97, tags: ["arroz"] },
        { name: "Tallarin Capri 500 gr", retailPrice: 1.11, tags: ["sin_existencia"] },
        { name: "PRECIO SOLIDARIO", retailPrice: 0.33, tags: ["verdura"] },
        { name: "Harina De Trigo Dulce Mar Leudante 1 Kg", retailPrice: 1.03, tags: ["harina"] },
        { name: "Harina De Trigo Dulce Mar Todo Uso 1 Kg", retailPrice: 0.95, tags: ["harina"] },
        { name: "Sardina El Morro Tomate", retailPrice: 0.48, tags: ["sin_existencia"] },
        { name: "Sardina El Morro en Aceite", retailPrice: 0.48, tags: ["reguera"] },
        { name: "Papel Luciano Natural 4 Rollos", retailPrice: 0.81, tags: ["aseo", "limpieza"] },
        { name: "jabon especial jirafa limon", retailPrice: 0.70, tags: ["jabon"] },
        { name: "SARDINA PEÑERO EN TOMATE 170G", retailPrice: 0.64, tags: ["sin_existencia"] },
        { name: "SARDINA PEÑERO EN ACEITE 170G", retailPrice: 0.64, tags: ["reguera"] },
        { name: "Jabon Especial jirafa Aloe Vera", retailPrice: 0.66, tags: ["jabon", "limpieza"] },
        { name: "Jabon Especial jirafa Bebe", retailPrice: 0.66, tags: ["jabon", "limpieza"] },
        { name: "Jabon Especial Jirafa Especial Blancura", retailPrice: 0.66, tags: ["jabon", "limpieza"] },
        { name: "Jabon Especial Jirafa limón", retailPrice: 0.66, tags: [] },
        { name: "Bombillo Led 18W", retailPrice: 1.30, tags: ["bombillos"] },
        { name: "sardina el farallon", retailPrice: 0.60, tags: ["sardina", "enlatado"] },
        { name: "ACEITE MI ACEITE 900 ML", retailPrice: 2.45, tags: ["viveres"] },
        { name: "ACEITE MI ACEITE 830ML", retailPrice: 2.45, tags: ["viveres"] },
        { name: "TOMATE", retailPrice: 1.54, tags: ["verdura"] },
        { name: "JUGO DE NARANJA TUNAL 200 ML", retailPrice: 0.27, tags: [] },
        { name: "MANZANA ROJA CALIBRE 125", retailPrice: 0.85, tags: [] },
        { name: "MANZANA ROJA CAL 113", retailPrice: 0.74, tags: ["verdura"] },
        { name: "Suavitel", retailPrice: 0.61, tags: ["limpieza"] },
        { name: "Suavitel fresca primavera 180ml", retailPrice: 0.61, tags: ["suavitel"] },
        { name: "Suavitel cuidado superior 180ml", retailPrice: 0.61, tags: [] },
        { name: "Aceituna entera Giralda 500GM", retailPrice: 1.99, tags: [] },
        { name: "Maiz Kaldini 400gr", retailPrice: 1.52, tags: ["enlatado"] },
        { name: "Konga De Limon", retailPrice: 0.51, tags: ["jugo", "frutas"] },
        { name: "Konga De Naranja", retailPrice: 0.51, tags: ["jugo", "frutas"] },
        { name: "Konga Sabor Mora", retailPrice: 0.51, tags: ["jugo", "frutas"] },
        { name: "Azucar Montalban", retailPrice: 1.27, tags: ["azucar"] },
        { name: "Azucar Montalban blanca 1kg", retailPrice: 1.27, tags: ["reguera"] },
        { name: "konga parchita", retailPrice: 0.51, tags: [] },
        { name: "Konga", retailPrice: 0.51, tags: [] },
        { name: "Pañales Baby Finger Talla G 10 unidades", retailPrice: 3.21, tags: ["viveres"] },
        { name: "Pañales Baby Finger XG 10 unidades", retailPrice: 3.21, tags: ["reguera"] },
        { name: "Mezcla Semillas Nutritivas Pan 500gr", retailPrice: 2.37, tags: ["secundario"] },
        { name: "bombillo almessy 12w", retailPrice: 1.03, tags: ["viveres"] },
        { name: "Mayonesa Kemy 190 gms", retailPrice: 1.11, tags: [] },
      ].map((p, index) => {
        const profitPercentage = Math.floor(Math.random() * (35 - 15 + 1)) + 15
        const costPrice = parseFloat((p.retailPrice / (1 + profitPercentage / 100)).toFixed(2))
        const stockOptions = [0, 5, Math.floor(Math.random() * 50) + 20]
        const currentStock = stockOptions[index % 3]

        return {
          name: p.name.trim(),
          internalCode: `P${String(index + 1).padStart(4, '0')}`,
          barcode: String(Date.now() + index),
          categoryId: getCategoryId(p.tags),
          costPrice: costPrice,
          costCurrency: "USD",
          profitPercentage: profitPercentage,
          retailPrice: p.retailPrice,
          dollarPrice: p.retailPrice,
          currentStock: currentStock,
          image: p.image || null,
          status: currentStock > 0 ? "activo" : "agotado",
        }
      })

      await Product.bulkCreate(productsData)
      console.log(`     -> ${productsData.length} productos creados.`)
    }

    console.log("   -> Productos creados exitosamente.")
  } catch (error) {
    console.error("Error creando productos:", error)
    throw error
  }
}

module.exports = { seedProducts }

if (require.main === module) {
  seedProducts()
    .then(() => {
      console.log("Seeder de productos ejecutado exitosamente.")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Error ejecutando seeder de productos:", error)
      process.exit(1)
    })
}