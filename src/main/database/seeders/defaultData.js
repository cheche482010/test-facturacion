const { User, Category, Settings, Product, Customer, Sale, SaleItem, InventoryMovement } = require("../models")
const { sequelize } = require("../connection")

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
      console.log("   -> Usuario administrador creado.")
    }

    // Crear categorías por defecto
    const categoriesExist = await Category.count()
    if (categoriesExist === 0) {
      const categories = [
        { name: "Electrónica", description: "Equipos electrónicos y componentes" },
        { name: "Bebidas", description: "Bebidas y refrescos" },
        { name: "Limpieza", description: "Productos de limpieza" },
        { name: "Cuidado Personal", description: "Productos de higiene personal" },
        { name: "Hogar", description: "Artículos para el hogar" },
      ]

      await Category.bulkCreate(categories)
      console.log("   -> Categorías por defecto creadas.")
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
          value: "tienda",
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
      console.log("   -> Configuraciones por defecto creadas.")
    }

    console.log("🌱 Sembrando datos de prueba (Clientes, Productos, Ventas)...")
    const transaction = await sequelize.transaction()
    try {
      // --- Obtener datos base ---
      const adminUser = await User.findOne({ where: { username: "admin" }, transaction })
      const categories = await Category.findAll({ transaction })

      // --- 1. Crear Clientes ---
      const customerCount = await Customer.count({ transaction })
      if (customerCount === 0) {
        const customersData = [
          {
            id: 1,
            customerCode: "C-000001",
            firstName: "Cliente",
            lastName: "General",
            document_type: "RIF",
            document_number: "V000000000",
            email: "consumidor@final.com",
            phone: "0000-0000000",
            address: "N/A",
            is_active: true,
          },
          {
            customerCode: "C-000002",
            firstName: "Maria",
            lastName: "Rodriguez",
            document_type: "CI",
            document_number: "V12345678",
            email: "maria.r@example.com",
            phone: "0412-1234567",
            address: "Caracas",
            is_active: true,
          },
          {
            customerCode: "C-000003",
            firstName: "Carlos",
            lastName: "Gomez",
            document_type: "CI",
            document_number: "V87654321",
            email: "carlos.g@example.com",
            phone: "0416-7654321",
            address: "Valencia",
            is_active: true,
          },
        ]
        await Customer.bulkCreate(customersData, { transaction })
        console.log(`   -> ${customersData.length} clientes creados.`)
      }

      // --- 2. Crear Productos ---
      const productCount = await Product.count({ transaction })
      if (productCount === 0 && categories.length > 0) {
        const productsData = [
          { name: "Laptop Pro 15", internalCode: "LP15", barcode: "1234567890123", categoryId: categories[0].id, costPrice: 800, retailPrice: 1200, currentStock: 50, minStock: 10, maxStock: 100, taxRate: 16, status: "activo" },
          { name: "Mouse Inalámbrico", internalCode: "MI01", barcode: "1234567890124", categoryId: categories[1].id, costPrice: 15, retailPrice: 25, currentStock: 200, minStock: 30, maxStock: 300, taxRate: 16, status: "activo" },
          { name: "Teclado Mecánico RGB", internalCode: "TM02", barcode: "1234567890125", categoryId: categories[1].id, costPrice: 60, retailPrice: 95, currentStock: 8, minStock: 10, maxStock: 150, taxRate: 16, status: "activo" }, // Stock bajo
          { name: "Monitor 27' 4K", internalCode: "M274K", barcode: "1234567890126", categoryId: categories[0].id, costPrice: 250, retailPrice: 400, currentStock: 30, minStock: 5, maxStock: 50, taxRate: 16, status: "activo" },
          { name: "Cable HDMI 2m", internalCode: "HDMI2", barcode: "1234567890127", categoryId: categories[2].id, costPrice: 5, retailPrice: 12, currentStock: 0, minStock: 20, maxStock: 200, taxRate: 16, status: "activo" }, // Sin stock
        ]
        await Product.bulkCreate(productsData, { transaction })
        console.log(`   -> ${productsData.length} productos creados.`)
      }

      // --- 3. Crear Ventas y Movimientos de Inventario ---
      const saleCount = await Sale.count({ transaction })
      if (saleCount === 0 && adminUser) {
        const customers = await Customer.findAll({ transaction })
        const products = await Product.findAll({ transaction })
        const saleDate = new Date()

        // Venta 1
        const sale1 = await Sale.create({
          saleNumber: `TIENDA-000001`, customerId: customers[1].id, userId: adminUser.id, saleType: "detal", operationMode: "tienda", subtotal: 1225, taxAmount: 196, total: 1225, paymentMethod: "pos", paymentStatus: "pagado", status: "completada", sale_date: new Date(new Date().setDate(new Date().getDate() - 5)),
        }, { transaction })
        await SaleItem.bulkCreate([
          { saleId: sale1.id, productId: products[0].id, quantity: 1, unitPrice: 1200, subtotal: 1200, total: 1200, taxRate: 16, taxAmount: 192 },
          { saleId: sale1.id, productId: products[1].id, quantity: 1, unitPrice: 25, subtotal: 25, total: 25, taxRate: 16, taxAmount: 4 },
        ], { transaction })

        // Venta 2
        const sale2 = await Sale.create({
          saleNumber: `TIENDA-000002`, customerId: customers[2].id, userId: adminUser.id, saleType: "detal", operationMode: "tienda", subtotal: 400, taxAmount: 64, total: 400, paymentMethod: "credito", paymentStatus: "pendiente", status: "completada", sale_date: new Date(new Date().setDate(new Date().getDate() - 2)),
        }, { transaction })
        await SaleItem.create({ saleId: sale2.id, productId: products[3].id, quantity: 1, unitPrice: 400, subtotal: 400, total: 400, taxRate: 16, taxAmount: 64 }, { transaction })

        // Venta 3 (Hoy)
        const sale3 = await Sale.create({
          saleNumber: `TIENDA-000003`, customerId: customers[1].id, userId: adminUser.id, saleType: "detal", operationMode: "tienda", subtotal: 95, taxAmount: 15.2, total: 95, paymentMethod: "efectivo_usd", paymentStatus: "pagado", status: "completada", sale_date: new Date(),
        }, { transaction })
        await SaleItem.create({ saleId: sale3.id, productId: products[2].id, quantity: 1, unitPrice: 95, subtotal: 95, total: 95, taxRate: 16, taxAmount: 15.2 }, { transaction })

        console.log("   -> 3 ventas de ejemplo creadas.")

        // --- 4. Actualizar Stock y Crear Movimientos de Inventario ---
        const allSaleItems = await SaleItem.findAll({
          where: { saleId: [sale1.id, sale2.id, sale3.id] },
          include: [{ model: Product, as: "product" }, { model: Sale, as: "sale" }],
          transaction,
        })

        for (const item of allSaleItems) {
          const product = item.product
          const previousStock = product.currentStock
          const newStock = previousStock - item.quantity

          await product.update({ currentStock: newStock }, { transaction })

          await InventoryMovement.create({
            productId: product.id, userId: item.sale.userId, movementType: "salida", reason: "venta", quantity: item.quantity, previousStock: previousStock, newStock: newStock, unitCost: product.costPrice, totalCost: product.costPrice * item.quantity, referenceId: item.saleId, referenceType: "sale", notes: `Venta ${item.sale.saleNumber}`,
          }, { transaction })
        }
        console.log("   -> Stock actualizado y movimientos de inventario creados.")
      }

      await transaction.commit()
      console.log("✅ Datos de prueba sembrados exitosamente.")
    } catch (error) {
      await transaction.rollback()
      console.error("❌ Error sembrando datos de prueba:", error)
    }

    console.log("✅ Datos por defecto y de prueba inicializados correctamente.")
  } catch (error) {
    console.error("Error al inicializar datos por defecto:", error)
  }
}

module.exports = { seedDefaultData }
