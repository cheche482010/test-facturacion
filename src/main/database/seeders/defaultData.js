require("dotenv").config()
const fs = require("fs")
const path = require("path")

const { User, Category, Settings, Product, Sale, SaleItem, SalePayment, PaymentMethod, InventoryMovement, DolarRate } = require("../models")
const { sequelize } = require("../connection")
const { Op } = require("sequelize")

const seedDefaultData = async () => {
  try {
    
    const adminExists = await User.findOne({ where: { username: "admin" } })
    if (!adminExists) {
      await User.create({
        username: "admin",
        email: "admin@sistema.com",
        password: "admin123",
        firstName: "Administrador",
        lastName: "Sistema",
        role: "administrador",
      })
      console.log("   -> Usuario administrador creado.")
    }

    const cajeroExists = await User.findOne({ where: { username: "cajero" } })
    if (!cajeroExists) {
      await User.create({
        username: "cajero",
        email: "cajero@sistema.com",
        password: "cajero123",
        firstName: "Cajero",
        lastName: "Sistema",
        role: "cajero",
      })
      console.log("   -> Usuario cajero creado.")
    }

    const devExists = await User.findOne({ where: { username: "dev" } })
    if (!devExists) {
      await User.create({
        username: "dev",
        email: "dev@sistema.com",
        password: "dev123",
        firstName: "Desarrollador",
        lastName: "Sistema",
        role: "dev",
      })
      console.log("   -> Usuario dev creado.")
    }

    const paymentMethodsExist = await PaymentMethod.count()
    if (paymentMethodsExist === 0) {
      const paymentMethods = [
        { name: "Efectivo BS", description: "Pago en efectivo en bolívares" },
        { name: "Efectivo USD", description: "Pago en efectivo en dólares" },
        { name: "Transferencia", description: "Pago por transferencia bancaria" },
        { name: "POS", description: "Pago con tarjeta de débito/crédito" },
        { name: "Pago Móvil", description: "Pago móvil" },
        { name: "Crédito", description: "Pago a crédito" },
      ]

      await PaymentMethod.bulkCreate(paymentMethods)
      console.log("   -> Métodos de pago por defecto creados.")
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
      ];

      await Category.bulkCreate(categories)
      console.log("   -> Categorías por defecto creadas.")
    }

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
        {
          key: "business_opening_time",
          value: "09:00",
          dataType: "string",
          category: "system",
          description: "Hora de apertura del negocio (HH:mm)",
        },
        {
          key: "system_title",
          value: "Facturación",
          dataType: "string",
          category: "interface",
          description: "Título del sistema",
        },
        {
          key: "system_logo",
          value: "",
          dataType: "string",
          category: "interface",
          description: "Logo del sistema (base64)",
        },
        {
          key: "primary_color",
          value: "#1976D2",
          dataType: "string",
          category: "interface",
          description: "Color primario del sistema",
        },
        {
          key: "secondary_color",
          value: "#4CAF50",
          dataType: "string",
          category: "interface",
          description: "Color secundario del sistema",
        },
        {
          key: "dark_mode",
          value: "false",
          dataType: "boolean",
          category: "interface",
          description: "Modo oscuro activado",
        },
        {
          key: "fonts_title",
          value: JSON.stringify({ font: "Arial", size: "24px" }),
          dataType: "json",
          category: "interface",
          description: "Configuración de fuente para títulos",
        },
        {
          key: "fonts_subtitle",
          value: JSON.stringify({ font: "Arial", size: "18px" }),
          dataType: "json",
          category: "interface",
          description: "Configuración de fuente para subtítulos",
        },
        {
          key: "fonts_text",
          value: JSON.stringify({ font: "Arial", size: "14px" }),
          dataType: "json",
          category: "interface",
          description: "Configuración de fuente para texto",
        },
        {
          key: "summary_cards_bg_color",
          value: "#FFFFFF",
          dataType: "string",
          category: "interface",
          description: "Color de fondo de las tarjetas resumen",
        },
        {
          key: "summary_cards_text_color",
          value: "#000000",
          dataType: "string",
          category: "interface",
          description: "Color de texto de las tarjetas resumen",
        },
        {
          key: "summary_cards_icon",
          value: "mdi-chart-line",
          dataType: "string",
          category: "interface",
          description: "Icono por defecto de las tarjetas resumen",
        },
        {
          key: "summary_cards_text_size",
          value: "16px",
          dataType: "string",
          category: "interface",
          description: "Tamaño del texto de las tarjetas resumen",
        },
      ]

      await Settings.bulkCreate(defaultSettings)
      console.log("   -> Configuraciones por defecto creadas.")
    }

    console.log("Sembrando datos de prueba (Productos, Ventas)...")
    const transaction = await sequelize.transaction()
    try {
      
      const adminUser = await User.findOne({ where: { username: "admin" }, transaction })
      const categories = await Category.findAll({ transaction })

      await Product.update(
        { image: null },
        {
          where: {
            image: {
              [Op.like]: 'https://kana.develop.cecosesola.imolko.net%'
            }
          },
          transaction
        }
      )
      console.log("   -> Imágenes externas rotas de productos existentes actualizadas a null.")

      const productCount = await Product.count({ transaction })
      if (productCount === 0 && categories.length > 0) {
        const categoryMap = categories.reduce((acc, cat) => {
          acc[cat.name.toLowerCase()] = cat.id;
          return acc;
        }, {});

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
          };
          if (!tags || tags.length === 0) return categoryMap["víveres"];
          const firstTag = tags[0].toLowerCase();
          const mappedCategory = tagMap[firstTag] || firstTag;
          return categoryMap[mappedCategory] || categoryMap["víveres"];
        };

        const productsDataPromises = [
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
          { name: "MANZANA VERDE", retailPrice: 0.87, tags: [] },
          { name: "Shampoo sobre Pantene PRO-V", retailPrice: 0.49, tags: [] },
          { name: "Afrecho 8 de Marzo", retailPrice: 1.70, tags: ["upc"] },
          { name: "Margarina Kemy 400Gr", retailPrice: 1.74, tags: [] },
        ].map((p, index) => {
          const profitPercentage = Math.floor(Math.random() * (35 - 15 + 1)) + 15; 
          const costPrice = parseFloat((p.retailPrice / (1 + profitPercentage / 100)).toFixed(2));
          const stockOptions = [0, 5, Math.floor(Math.random() * 50) + 20]; 
          const currentStock = stockOptions[index % 3];

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
          };
        });

        const productsData = productsDataPromises;

        await Product.bulkCreate(productsData, { transaction })
        console.log(`   -> ${productsData.length} productos creados.`)
      }

      const today = new Date().toISOString().split('T')[0]
      let dolarRate = await DolarRate.findOne({ where: { date: today }, transaction })
      if (!dolarRate) {
        dolarRate = await DolarRate.create({
          rate: 36.5,
          date: today,
          source: "manual",
        }, { transaction })
        console.log("   -> Tasa de dólar creada para hoy.")
      }

      const saleCount = await Sale.count({ transaction })
      if (saleCount === 0 && adminUser) {
        const products = await Product.findAll({ where: { currentStock: { [Op.gt]: 0 } }, transaction }).catch(() => [])
        if (!products || products.length === 0) {
          console.log("   -> No hay suficientes productos con stock para crear ventas de ejemplo.")
          await transaction.commit()
          return
        }

        if (products.length < 10) {
          console.log("   -> No hay suficientes productos con stock para crear ventas de ejemplo.");
          await transaction.commit();
          return;
        }

        const productToAdjustIn = products[0];
        const previousStockIn = productToAdjustIn.currentStock;
        const quantityIn = 50;
        const newStockIn = previousStockIn + quantityIn;
        await productToAdjustIn.update({ currentStock: newStockIn }, { transaction });
        await InventoryMovement.create({
          productId: productToAdjustIn.id,
          userId: adminUser.id,
          movementType: "entrada",
          reason: "compra",
          quantity: quantityIn,
          previousStock: previousStockIn,
          newStock: newStockIn,
          unitCost: productToAdjustIn.costPrice,
          totalCost: productToAdjustIn.costPrice * quantityIn,
          notes: "Recepción de mercancía proveedor A",
          movementDate: new Date(new Date().setDate(new Date().getDate() - 10)),
        }, { transaction });

        
        const productToAdjustOut = products[1];
        const previousStockOut = productToAdjustOut.currentStock;
        const quantityOut = 2;
        const newStockOut = previousStockOut - quantityOut;
        await productToAdjustOut.update({ currentStock: newStockOut }, { transaction });
        await InventoryMovement.create({
          productId: productToAdjustOut.id,
          userId: adminUser.id,
          movementType: "salida",
          reason: "merma",
          quantity: quantityOut,
          previousStock: previousStockOut,
          newStock: newStockOut,
          unitCost: productToAdjustOut.costPrice,
          totalCost: productToAdjustOut.costPrice * quantityOut,
          notes: "Producto dañado en almacén",
          movementDate: new Date(new Date().setDate(new Date().getDate() - 8)),
        }, { transaction });
        console.log("   -> 2 ajustes de inventario creados.");

        const totalUsd1 = parseFloat((Number(products[2].retailPrice) + Number(products[3].retailPrice)).toFixed(2))
        const totalBs1 = totalUsd1 * 36.5
        const sale1 = await Sale.create({
          saleNumber: `BODEGA-000001`, userId: adminUser.id, totalUsd: totalUsd1, totalBs: totalBs1, dolarRateId: dolarRate.id, status: "completada", saleDate: new Date(new Date().setDate(new Date().getDate() - 5)),
        }, { transaction })
        await SaleItem.bulkCreate([
          { saleId: sale1.id, productId: products[2].id, quantity: 1, unitPriceBs: products[2].retailPrice * 36.5, subtotalBs: products[2].retailPrice * 36.5 },
          { saleId: sale1.id, productId: products[3].id, quantity: 1, unitPriceBs: products[3].retailPrice * 36.5, subtotalBs: products[3].retailPrice * 36.5 },
        ], { transaction })

        
        const totalUsd2 = parseFloat(Number(products[4].retailPrice).toFixed(2))
        const totalBs2 = totalUsd2 * 36.5
        const sale2 = await Sale.create({
          saleNumber: `BODEGA-000002`, userId: adminUser.id, totalUsd: totalUsd2, totalBs: totalBs2, dolarRateId: dolarRate.id, status: "completada", saleDate: new Date(new Date().setDate(new Date().getDate() - 2)),
        }, { transaction })
        await SaleItem.create({ saleId: sale2.id, productId: products[4].id, quantity: 1, unitPriceBs: products[4].retailPrice * 36.5, subtotalBs: products[4].retailPrice * 36.5 }, { transaction })

        
        const totalUsd3 = parseFloat(Number(products[5].retailPrice).toFixed(2))
        const totalBs3 = totalUsd3 * 36.5
        const sale3 = await Sale.create({
          saleNumber: `BODEGA-000003`, userId: adminUser.id, totalUsd: totalUsd3, totalBs: totalBs3, dolarRateId: dolarRate.id, status: "completada", saleDate: new Date(),
        }, { transaction })
        await SaleItem.create({ saleId: sale3.id, productId: products[5].id, quantity: 1, unitPriceBs: products[5].retailPrice * 36.5, subtotalBs: products[5].retailPrice * 36.5 }, { transaction })

        const totalUsd4 = parseFloat((Number(products[6].retailPrice) * 2).toFixed(2))
        const totalBs4 = totalUsd4 * 36.5
        const sale4 = await Sale.create({
          saleNumber: `BODEGA-000004`, userId: adminUser.id, totalUsd: totalUsd4, totalBs: totalBs4, dolarRateId: dolarRate.id, status: "completada", saleDate: new Date(),
        }, { transaction })
        await SaleItem.create({ saleId: sale4.id, productId: products[6].id, quantity: 2, unitPriceBs: products[6].retailPrice * 36.5, subtotalBs: (products[6].retailPrice * 2) * 36.5 }, { transaction })

        const totalUsd5 = parseFloat((Number(products[7].retailPrice) + Number(products[8].retailPrice)).toFixed(2))
        const totalBs5 = totalUsd5 * 36.5
        const sale5 = await Sale.create({
          saleNumber: `BODEGA-000005`, userId: adminUser.id, totalUsd: totalUsd5, totalBs: totalBs5, dolarRateId: dolarRate.id, status: "completada", saleDate: new Date(),
        }, { transaction })
        await SaleItem.bulkCreate([
          { saleId: sale5.id, productId: products[7].id, quantity: 1, unitPriceBs: products[7].retailPrice * 36.5, subtotalBs: products[7].retailPrice * 36.5 },
          { saleId: sale5.id, productId: products[8].id, quantity: 1, unitPriceBs: products[8].retailPrice * 36.5, subtotalBs: products[8].retailPrice * 36.5 },
        ], { transaction })

        console.log("   -> 5 ventas de ejemplo creadas.")

        const allSaleItems = await SaleItem.findAll({
          where: { saleId: [sale1.id, sale2.id, sale3.id, sale4.id, sale5.id] },
          include: [{ model: Product, as: "product" }, { model: Sale, as: "sale" }],
          transaction,
        })

        for (const item of allSaleItems) {
          const product = item.product
          const previousStock = product.currentStock
          const newStock = Math.max(0, previousStock - item.quantity) 

          await product.update({ currentStock: newStock }, { transaction })

          await InventoryMovement.create({
            productId: product.id, userId: item.sale.userId, movementType: "salida", reason: "venta", quantity: item.quantity, previousStock: previousStock, newStock: newStock, unitCost: product.costPrice, totalCost: product.costPrice * item.quantity, referenceId: item.saleId, referenceType: "sale", notes: `Venta ${item.sale.saleNumber}`, movementDate: item.sale.saleDate
          }, { transaction })
        }
        console.log("   -> Stock actualizado y movimientos de inventario por ventas creados.")
      }

      await transaction.commit()
      console.log(" Datos de prueba sembrados exitosamente.")
    } catch (error) {
      await transaction.rollback()
      console.error(" Error sembrando datos de prueba:", error)
    }

    console.log("Datos por defecto y de prueba inicializados correctamente.")
  } catch (error) {
    console.error("Error al inicializar datos por defecto:", error)
  }
}

module.exports = { seedDefaultData }

if (require.main === module) {
  seedDefaultData()
    .then(() => {
      console.log(" Seeder ejecutado exitosamente.")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Error ejecutando seeder:", error)
      process.exit(1)
    })
}
