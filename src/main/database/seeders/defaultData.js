const { User, Category, Settings } = require("../models")

const seedDefaultData = async () => {
  try {
    // Crear usuario administrador por defecto
    const adminExists = await User.findOne({ where: { username: "admin" } })
    if (!adminExists) {
      await User.create({
        username: "admin",
        email: "admin@sistema.com",
        password: "admin123",
        firstName: "Administrador",
        lastName: "Sistema",
        role: "admin",
      })
      console.log("Usuario administrador creado")
    }

    // Crear categorías por defecto
    const categoriesExist = await Category.count()
    if (categoriesExist === 0) {
      const categories = [
        { name: "Alimentos", description: "Productos alimenticios" },
        { name: "Bebidas", description: "Bebidas y refrescos" },
        { name: "Limpieza", description: "Productos de limpieza" },
        { name: "Cuidado Personal", description: "Productos de higiene personal" },
        { name: "Hogar", description: "Artículos para el hogar" },
      ]

      await Category.bulkCreate(categories)
      console.log("Categorías por defecto creadas")
    }

    // Configuraciones por defecto
    const settingsExist = await Settings.count()
    if (settingsExist === 0) {
      const defaultSettings = [
        {
          key: "company_name",
          value: "Mi Empresa",
          category: "company",
          description: "Nombre de la empresa",
        },
        {
          key: "company_rif",
          value: "J-12345678-9",
          category: "company",
          description: "RIF de la empresa",
        },
        {
          key: "company_address",
          value: "Dirección de la empresa",
          category: "company",
          description: "Dirección fiscal",
        },
        {
          key: "operation_mode",
          value: "bodega",
          category: "system",
          description: "Modo de operación: bodega o tienda",
        },
        {
          key: "default_currency",
          value: "VES",
          category: "system",
          description: "Moneda por defecto",
        },
        {
          key: "exchange_rate",
          value: "36.50",
          dataType: "number",
          category: "system",
          description: "Tasa de cambio USD/VES",
        },
        {
          key: "auto_update_exchange_rate",
          value: "true",
          dataType: "boolean",
          category: "system",
          description: "Actualizar tasa automáticamente",
        },
        {
          key: "default_tax_rate",
          value: "16.00",
          dataType: "number",
          category: "system",
          description: "Tasa de IVA por defecto",
        },
      ]

      await Settings.bulkCreate(defaultSettings)
      console.log("Configuraciones por defecto creadas")
    }

    console.log("Datos por defecto inicializados correctamente")
  } catch (error) {
    console.error("Error al inicializar datos por defecto:", error)
  }
}

module.exports = { seedDefaultData }
