const { Op } = require("sequelize")
const { Sale, SaleItem, Product, User, Settings, InventoryMovement, DolarRate } = require("../database/models")
const { sequelize } = require("../database/connection")

const reportsController = {
  async getDashboard(req, res) {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const sevenDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)

      const totalProducts = await Product.count()
      const totalSales = await Sale.sum("total_bs")
      const inventoryValueResult = await Product.findOne({
        attributes: [[sequelize.literal("SUM(current_stock * cost_price)"), "value"]],
        raw: true,
      })
      const inventoryValue = inventoryValueResult?.value

      const todaySales = await Sale.sum("total_bs", {
        where: { sale_date: { [Op.gte]: startOfDay } },
      })

      const salesLast7Days = await Sale.findAll({
        where: { sale_date: { [Op.gte]: sevenDaysAgo } },
        attributes: [
          [sequelize.fn("DATE", sequelize.col("sale_date")), "date"],
          [sequelize.fn("SUM", sequelize.col("total_bs")), "total"],
        ],
        group: [sequelize.literal("DATE(sale_date)")],
        order: [[sequelize.literal("DATE(sale_date)"), "ASC"]],
      })

      const lowStockProducts = await Product.findAll({
        where: {
          [Op.and]: [sequelize.literal("current_stock <= 5"), { status: "activo" }],
        },
        attributes: ["id", "name", "current_stock", "internal_code"],
        limit: 5,
      })

      const activeProducts = await Product.count({ where: { status: "activo" } })
      const lowStockCount = await Product.count({
        where: {
          [Op.and]: [sequelize.literal("current_stock <= 5"), { status: "activo" }],
        },
      })
      const pendingInvoices = await Sale.count({ where: { payment_status: "pendiente" } })

      const recentSales = await Sale.findAll({
        limit: 5,
        order: [["sale_date", "DESC"]],
        attributes: [
          "id",
          "sale_number",
          "total_bs",
          "sale_date",
          "status"
        ]
      })

      res.json({
        summary: {
          totalProducts,
          totalSales: totalSales || 0,
          todaySales: todaySales || 0,
          inventoryValue: inventoryValue || 0,
        },
        salesLast7Days,
        lowStockProducts,
        quickSummary: {
          activeProducts,
          lowStockCount,
          pendingInvoices,
        },
        recentSales,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      res.status(500).json({ error: "Failed to fetch dashboard data" })
    }
  },

  async getSalesReport(req, res) {
    try {
      const { startDate, endDate, groupBy = "day" } = req.query

      let dateFormat
      switch (groupBy) {
        case "hour":
          dateFormat = "%Y-%m-%d %H:00:00"
          break
        case "day":
          dateFormat = "%Y-%m-%d"
          break
        case "week":
          dateFormat = "%Y-%u"
          break
        case "month":
          dateFormat = "%Y-%m"
          break
        default:
          dateFormat = "%Y-%m-%d"
      }

      const sales = await Sale.findAll({
        where: {
          sale_date: {
            [Op.between]: [startDate, endDate],
          },
        },
        attributes: [
          [sequelize.literal(`DATE_FORMAT(sale_date, '${dateFormat}')`), "period"],
          [sequelize.fn("COUNT", sequelize.col("id")), "totalSales"],
          [sequelize.fn("SUM", sequelize.col("total_bs")), "totalAmount"],
          [sequelize.fn("AVG", sequelize.col("total_bs")), "averageTicket"],
        ],
        group: [sequelize.literal(`DATE_FORMAT(sale_date, '${dateFormat}')`)],
        order: [[sequelize.literal(`DATE_FORMAT(sale_date, '${dateFormat}')`), "ASC"]],
      })

      res.json(sales)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async getProductsReport(req, res) {
    try {
      const { startDate, endDate, limit = 20 } = req.query

      const productStats = await SaleItem.findAll({
        include: [
          {
            model: Sale,
            as: 'sale',
            where:
              startDate && endDate
                ? {
                  sale_date: {
                    [Op.between]: [startDate, endDate],
                  },
                }
                : {},
            attributes: [],
          },
          {
            model: Product,
            as: "product",
            attributes: [],
          },
        ],
        attributes: [
          "product_id",
          [sequelize.col("product.name"), "productName"],
          [sequelize.fn("SUM", sequelize.col("quantity")), "totalSold"],
          [sequelize.fn("SUM", sequelize.col("SaleItem.subtotalBs")), "totalRevenue"],
          [sequelize.literal("SUM(SaleItem.quantity * Product.cost_price)"), "totalCost"],
        ],
        group: ["product_id", "product.id"],
        order: [[sequelize.fn("SUM", sequelize.col("SaleItem.total_bs")), "DESC"]],
        limit: Number.parseInt(limit),
      })

      res.json(productStats)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async getInventoryReport(req, res) {
    try {
      const { category, status = "all" } = req.query

      const whereClause = { status: "activo" }
      if (category) {
        whereClause.category_id = category
      }

      const products = await Product.findAll({
        where: whereClause,
        attributes: [
          "id",
          "name",
          "category_id",
          "current_stock",
          "cost_price",
          "retail_price",
        ],
        order: [["name", "ASC"]],
      })

      let filteredProducts = products
      if (status === "low") {
        filteredProducts = products.filter((p) => p.current_stock <= 5)
      } else if (status === "out") {
        filteredProducts = products.filter((p) => p.current_stock === 0)
      } else if (status === "overstock") {
        filteredProducts = products.filter((p) => p.current_stock > 100)
      }

      const inventoryValue = filteredProducts.reduce((total, product) => {
        return total + product.current_stock * product.cost_price
      }, 0)

      const inventoryRetailValue = filteredProducts.reduce((total, product) => {
        return total + product.current_stock * product.retail_price
      }, 0)

      res.json({
        products: filteredProducts,
        summary: {
          totalProducts: filteredProducts.length,
          inventoryValue,
          inventoryRetailValue,
          potentialProfit: inventoryRetailValue - inventoryValue,
        },
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async getFinancialReport(req, res) {
    try {
      const { startDate, endDate } = req.query

      const salesData = await Sale.findOne({
        where: {
          sale_date: {
            [Op.between]: [startDate, endDate],
          },
        },
        attributes: [
          [sequelize.fn("SUM", sequelize.col("subtotal_bs")), "totalRevenue"],
          [sequelize.fn("SUM", sequelize.col("total_bs")), "totalSales"],
          [sequelize.fn("COUNT", sequelize.col("id")), "transactionCount"],
        ],
      })

      const costData = await SaleItem.findOne({
        include: [
          {
            model: Sale,
            where: {
              sale_date: {
                [Op.between]: [startDate, endDate],
              },
            },
            as: "sale",
            attributes: [],
          },
          {
            model: Product,
            as: "product",
            attributes: [],
          },
        ],
        attributes: [[sequelize.literal("SUM(SaleItem.quantity * Product.cost_price)"), "totalCost"]],
      })

      const paymentMethods = await Sale.findAll({
        where: {
          sale_date: {
            [Op.between]: [startDate, endDate],
          },
        },
        attributes: [
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          [sequelize.fn("SUM", sequelize.col("total_bs")), "total"],
        ],
        include: [{
          model: require('../database/models').SalePayment,
          as: 'payments',
          include: [{
            model: require('../database/models').PaymentMethod,
            as: 'paymentMethod',
            attributes: ['name']
          }],
          attributes: []
        }],
        attributes: [
          [sequelize.col('payments->paymentMethod.name'), 'payment_method'],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          [sequelize.fn("SUM", sequelize.col("total_bs")), "total"],
        ],
        group: [sequelize.col('payments->paymentMethod.name')],
      })

      const revenue = Number.parseFloat(salesData?.dataValues?.totalRevenue || 0)
      const cost = Number.parseFloat(costData?.dataValues?.totalCost || 0)
      const grossProfit = revenue - cost
      const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0

      res.json({
        revenue,
        cost,
        grossProfit,
        grossMargin,
        tax: 0,
        totalSales: Number.parseFloat(salesData?.dataValues?.totalSales || 0),
        transactionCount: Number.parseInt(salesData?.dataValues?.transactionCount || 0),
        paymentMethods,
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async getUsersReport(req, res) {
    try {
      const { startDate, endDate } = req.query

      const userActivity = await Sale.findAll({
        where:
          startDate && endDate
            ? {
              sale_date: {
                [Op.between]: [startDate, endDate],
              },
            }
            : {},
        include: [
          {
            model: User,
            attributes: ["username", "first_name", "last_name"],
          },
        ],
        attributes: [
          "user_id",
          [sequelize.fn("COUNT", sequelize.col("Sale.id")), "totalSales"],
          [sequelize.fn("SUM", sequelize.col("total_bs")), "totalAmount"],
          [sequelize.fn("AVG", sequelize.col("total_bs")), "averageTicket"],
        ],
        group: ["user_id", "User.id"],
        order: [[sequelize.fn("SUM", sequelize.col("total")), "DESC"]],
      })

      res.json(userActivity)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async getCashCount(req, res) {
    try {
      const { date } = req.query

      // Obtener hora de apertura desde Settings
      const openingSetting = await Settings.findOne({ where: { key: "openingTime" } })
      const openingTime = (openingSetting?.value || "08:00").toString()

      const [openHour, openMinute] = openingTime.split(":").map((v) => Number.parseInt(v, 10))
      const target = date ? new Date(date) : new Date()

      // Rango de día del arqueo basado en hora de apertura
      const dayStart = new Date(
        target.getFullYear(),
        target.getMonth(),
        target.getDate(),
        Number.isFinite(openHour) ? openHour : 8,
        Number.isFinite(openMinute) ? openMinute : 0,
        0,
        0,
      )
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const whereDay = {
        sale_date: { [Op.between]: [dayStart, dayEnd] },
        status: "completada",
      }

      // Totales del día
      const dayTotalsRow = await Sale.findOne({
        where: whereDay,
        attributes: [
          [sequelize.fn("SUM", sequelize.col("subtotal_bs")), "subtotal"],
          [sequelize.fn("SUM", sequelize.col("total_bs")), "total"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        raw: true,
      })

      const payments = await Sale.findAll({
        where: whereDay,
        include: [{
          model: require('../database/models').SalePayment,
          as: 'payments',
          include: [{
            model: require('../database/models').PaymentMethod,
            as: 'paymentMethod',
            attributes: ['name']
          }],
          attributes: []
        }],
        attributes: [
          [sequelize.col('payments->paymentMethod.name'), 'payment_method'],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          [sequelize.fn("SUM", sequelize.col("total_bs")), "total"],
        ],
        group: [sequelize.col('payments->paymentMethod.name')],
        raw: true,
      })

      const sales = await Sale.findAll({
        where: whereDay,
        attributes: ["id", "sale_number", "total_bs", "sale_date", "status"],
        order: [["sale_date", "ASC"]],
        raw: true,
      })

      // Semana a la fecha (basado en lunes como inicio de semana)
      const dayOfWeek = (dayStart.getDay() + 6) % 7 // 0 = lunes
      const weekStartDate = new Date(dayStart)
      weekStartDate.setDate(weekStartDate.getDate() - dayOfWeek)
      weekStartDate.setHours(Number.isFinite(openHour) ? openHour : 8, Number.isFinite(openMinute) ? openMinute : 0, 0, 0)

      const weekTotalsRow = await Sale.findOne({
        where: {
          sale_date: { [Op.between]: [weekStartDate, dayEnd] },
          status: "completada",
        },
        attributes: [[sequelize.fn("SUM", sequelize.col("total_bs")), "total"]],
        raw: true,
      })

      // Mes a la fecha
      const monthStartDate = new Date(dayStart.getFullYear(), dayStart.getMonth(), 1, Number.isFinite(openHour) ? openHour : 8, Number.isFinite(openMinute) ? openMinute : 0, 0, 0)
      const monthTotalsRow = await Sale.findOne({
        where: {
          sale_date: { [Op.between]: [monthStartDate, dayEnd] },
          status: "completada",
        },
        attributes: [[sequelize.fn("SUM", sequelize.col("total_bs")), "total"]],
        raw: true,
      })

      res.json({
        range: { start: dayStart, end: dayEnd, openingTime },
        totals: {
          subtotal: Number.parseFloat(dayTotalsRow?.subtotal || 0),
          tax: 0,
          total: Number.parseFloat(dayTotalsRow?.total || 0),
          count: Number.parseInt(dayTotalsRow?.count || 0, 10),
        },
        byPaymentMethod: payments.map((p) => ({
          paymentMethod: p.payment_method,
          count: Number.parseInt(p.count || 0, 10),
          total: Number.parseFloat(p.total || 0),
        })),
        sales,
        weekToDateTotal: Number.parseFloat(weekTotalsRow?.total || 0),
        monthToDateTotal: Number.parseFloat(monthTotalsRow?.total || 0),
      })
    } catch (error) {
      console.error("Error fetching cash count:", error)
      res.status(500).json({ error: error.message })
    }
  },

  // Reporte de Ventas Detallado Completo
  async getDetailedSalesReport(req, res) {
    try {
      const { startDate, endDate, batch } = req.query

      let whereClause = {}

      // Solo filtrar por status completada si no estamos en desarrollo
      if (process.env.NODE_ENV === 'production') {
        whereClause.status = "completada"
      }

      if (batch) {
        whereClause.saleNumber = { [Op.like]: `%${batch}%` }
      }

      const sales = await Sale.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['username', 'first_name', 'last_name']
          },
          {
            model: DolarRate,
            as: 'dolarRate',
            attributes: ['rate']
          },
          {
            model: require('../database/models').CashReconciliation,
            as: 'reconciliation',
            attributes: ['id', 'lote', 'openingDate', 'closingDate']
          },
          {
            model: require('../database/models').SaleItem,
            as: 'items',
            include: [{
              model: require('../database/models').Product,
              as: 'product',
              attributes: ['name', 'internalCode', 'retailPrice']
            }],
            attributes: ['quantity', 'unitPriceBs', 'subtotalBs']
          },
          {
            model: require('../database/models').SalePayment,
            as: 'payments',
            include: [{
              model: require('../database/models').PaymentMethod,
              as: 'paymentMethod',
              attributes: ['name']
            }],
            attributes: ['amount', 'reference', 'notes']
          }
        ],
        attributes: [
          'id', 'saleNumber', 'totalUsd', 'totalBs', 'sale_date', 'paymentStatus',
          'changeGivenBs', 'changeGivenUsd', 'notes'
        ],
        order: [['sale_date', 'DESC']]
      })


      const currentDolarRate = await DolarRate.findOne({
        order: [['date', 'DESC']]
      })

      const salesWithCompleteDetails = sales.map(sale => {
        const saleData = sale.toJSON()

        // Calcular total vendido (sin cambio)
        const totalSoldBs = parseFloat(saleData.totalBs) - parseFloat(saleData.changeGivenBs || 0)
        const totalSoldUsd = totalSoldBs / (saleData.dolarRate?.rate || 1)

        return {
          ...saleData,
          totalBs: parseFloat(parseFloat(saleData.totalBs).toFixed(2)),
          totalUsd: parseFloat(parseFloat(saleData.totalUsd).toFixed(2)),
          totalSoldBs: parseFloat(totalSoldBs.toFixed(2)),
          totalSoldUsd: parseFloat(totalSoldUsd.toFixed(2)),
          changeGivenBs: parseFloat(parseFloat(saleData.changeGivenBs || 0).toFixed(2)),
          changeGivenUsd: parseFloat(parseFloat(saleData.changeGivenUsd || 0).toFixed(2)),
          saleDate: saleData.sale_date,
          userName: saleData.user ? `${saleData.user.first_name} ${saleData.user.last_name}` : 'Usuario Desconocido',
          dolarRateAtSale: parseFloat(parseFloat(saleData.dolarRate?.rate || 0).toFixed(2)),
          currentDolarRate: currentDolarRate ? parseFloat(parseFloat(currentDolarRate.rate).toFixed(2)) : null,
          reconciliation: saleData.reconciliation ? {
            id: saleData.reconciliation.id,
            lote: saleData.reconciliation.lote,
            openingDate: saleData.reconciliation.openingDate,
            closingDate: saleData.reconciliation.closingDate
          } : null,
          items: saleData.items ? saleData.items.map(item => ({
            productName: item.product?.name || 'Producto Desconocido',
            productCode: item.product?.internalCode || 'N/A',
            quantity: parseFloat(item.quantity),
            unitPriceBs: parseFloat(parseFloat(item.unitPriceBs).toFixed(2)),
            unitPriceUsd: parseFloat((parseFloat(item.unitPriceBs) / (saleData.dolarRate?.rate || 1)).toFixed(2)),
            subtotalBs: parseFloat(parseFloat(item.subtotalBs).toFixed(2)),
            subtotalUsd: parseFloat((parseFloat(item.subtotalBs) / (saleData.dolarRate?.rate || 1)).toFixed(2))
          })) : [],
          payments: saleData.payments ? saleData.payments.map(payment => ({
            methodName: payment.paymentMethod?.name || 'Método Desconocido',
            amount: parseFloat(parseFloat(payment.amount).toFixed(2)),
            amountUsd: parseFloat((parseFloat(payment.amount) / (saleData.dolarRate?.rate || 1)).toFixed(2)),
            reference: payment.reference || '',
            notes: payment.notes || ''
          })) : []
        }
      })

      res.json({
        sales: salesWithCompleteDetails,
        currentDolarRate: currentDolarRate ? parseFloat(currentDolarRate.rate) : null,
        filters: { startDate, endDate, batch },
        summary: {
          totalSales: salesWithCompleteDetails.length,
          totalAmountBs: parseFloat(salesWithCompleteDetails.reduce((sum, sale) => sum + sale.totalBs, 0).toFixed(2)),
          totalAmountUsd: parseFloat(salesWithCompleteDetails.reduce((sum, sale) => sum + sale.totalUsd, 0).toFixed(2)),
          totalSoldBs: parseFloat(salesWithCompleteDetails.reduce((sum, sale) => sum + sale.totalSoldBs, 0).toFixed(2)),
          totalSoldUsd: parseFloat(salesWithCompleteDetails.reduce((sum, sale) => sum + sale.totalSoldUsd, 0).toFixed(2)),
          totalChangeGivenBs: parseFloat(salesWithCompleteDetails.reduce((sum, sale) => sum + sale.changeGivenBs, 0).toFixed(2)),
          totalChangeGivenUsd: parseFloat(salesWithCompleteDetails.reduce((sum, sale) => sum + sale.changeGivenUsd, 0).toFixed(2))
        }
      })
    } catch (error) {
      console.error("Error fetching detailed sales report:", error)
      res.status(500).json({ error: error.message })
    }
  },

  // Reporte de Inventario Detallado
  async getDetailedInventoryReport(req, res) {
    try {
      const { category, status = "all" } = req.query

      let whereClause = {
        status: "activo",
        retailPrice: { [Op.gt]: 0 }
      }

      if (category) {
        whereClause.categoryId = category
      }

      const products = await Product.findAll({
        where: whereClause,
        attributes: [
          'id', 'name', 'internalCode', 'currentStock', 'costPrice', 'retailPrice', 'dollarPrice', 'status', 'color'
        ],
        order: [['name', 'ASC']]
      })

      const currentDolarRate = await DolarRate.findOne({
        order: [['date', 'DESC']]
      })

      const productsWithStatus = products.map(product => {
        let stockStatus = 'normal'
        let stockColor = 'green'

        const stock = parseInt(product.currentStock) || 0

        if (stock === 0) {
          stockStatus = 'agotado'
          stockColor = 'red'
        } else if (stock <= 5) {
          stockStatus = 'bajo'
          stockColor = 'orange'
        }

        const retailPriceBs = currentDolarRate ?
          parseFloat(product.retailPrice) * parseFloat(currentDolarRate.rate) : 0

        return {
          ...product.toJSON(),
          stockStatus,
          stockColor,
          retailPriceBs: parseFloat(retailPriceBs.toFixed(2)),
          retailPriceUsd: parseFloat(parseFloat(product.retailPrice).toFixed(2)),
          costPriceBs: currentDolarRate ?
            parseFloat((parseFloat(product.costPrice) * parseFloat(currentDolarRate.rate)).toFixed(2)) : parseFloat((0).toFixed(2)),
          costPriceUsd: parseFloat(parseFloat(product.costPrice).toFixed(2)),
          color: product.color
        }
      })

      let filteredProducts = productsWithStatus
      if (status === "low") {
        filteredProducts = productsWithStatus.filter(p => p.stockStatus === 'bajo')
      } else if (status === "out") {
        filteredProducts = productsWithStatus.filter(p => p.stockStatus === 'agotado')
      }

      res.json({
        products: filteredProducts,
        currentDolarRate: currentDolarRate ? parseFloat(currentDolarRate.rate) : null,
        summary: {
          totalProducts: filteredProducts.length,
          lowStockCount: productsWithStatus.filter(p => p.stockStatus === 'bajo').length,
          outOfStockCount: productsWithStatus.filter(p => p.stockStatus === 'agotado').length,
          totalValueBs: parseFloat(filteredProducts.reduce((sum, p) => sum + (p.retailPriceBs * p.currentStock), 0).toFixed(2)),
          totalValueUsd: parseFloat(filteredProducts.reduce((sum, p) => sum + (p.retailPriceUsd * p.currentStock), 0).toFixed(2))
        }
      })
    } catch (error) {
      console.error("Error fetching detailed inventory report:", error)
      res.status(500).json({ error: error.message })
    }
  },

  // Reporte de Ajuste de Inventario
  async getInventoryAdjustmentsReport(req, res) {
    try {
      const { startDate, endDate, type } = req.query

      let whereClause = {
        movementDate: {
          [Op.between]: [startDate, endDate],
        }
      }

      if (type) {
        if (type === 'sales') {
          whereClause.reason = 'venta'
        } else if (type === 'adjustments') {
          whereClause.reason = 'ajuste_inventario'
        }
      }

      const movements = await InventoryMovement.findAll({
        where: whereClause,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['name', 'internalCode', 'retailPrice']
          },
          {
            model: User,
            as: 'user',
            attributes: ['username', 'first_name', 'last_name']
          }
        ],
        attributes: [
          'id', 'movementType', 'reason', 'quantity', 'previousStock', 'newStock',
          'unitCost', 'totalCost', 'referenceId', 'referenceType', 'notes', 'movementDate'
        ],
        order: [['movementDate', 'DESC']]
      })

      const currentDolarRate = await DolarRate.findOne({
        order: [['date', 'DESC']]
      })

      const movementsWithPrices = movements.map(movement => ({
        ...movement.toJSON(),
        productName: movement.product ? movement.product.name : 'Producto Desconocido',
        productCode: movement.product ? movement.product.internalCode : 'N/A',
        userName: movement.user ? `${movement.user.first_name} ${movement.user.last_name}` : 'Usuario Desconocido',
        quantity: parseFloat(movement.quantity),
        unitCostBs: currentDolarRate ?
          parseFloat((parseFloat(movement.unitCost) * parseFloat(currentDolarRate.rate)).toFixed(2)) : parseFloat((0).toFixed(2)),
        unitCostUsd: parseFloat(parseFloat(movement.unitCost).toFixed(2)),
        totalCostBs: currentDolarRate ?
          parseFloat((parseFloat(movement.totalCost) * parseFloat(currentDolarRate.rate)).toFixed(2)) : parseFloat((0).toFixed(2)),
        totalCostUsd: parseFloat(parseFloat(movement.totalCost).toFixed(2)),
        movementDate: movement.movementDate
      }))

      res.json({
        movements: movementsWithPrices,
        currentDolarRate: currentDolarRate ? parseFloat(currentDolarRate.rate) : null,
        summary: {
          totalMovements: movementsWithPrices.length,
          totalQuantity: parseFloat(movementsWithPrices.reduce((sum, m) => sum + m.quantity, 0).toFixed(2)),
          totalValueBs: parseFloat(movementsWithPrices.reduce((sum, m) => sum + m.totalCostBs, 0).toFixed(2)),
          totalValueUsd: parseFloat(movementsWithPrices.reduce((sum, m) => sum + m.totalCostUsd, 0).toFixed(2))
        }
      })
    } catch (error) {
      console.error("Error fetching inventory adjustments report:", error)
      res.status(500).json({ error: error.message })
    }
  },

  // Reporte de Inventario por Productos o Completo
  async getProductInventoryReport(req, res) {
    try {
      const { productId, complete = 'true', category, status = 'all', stockFilter = 'all', showAll } = req.query

      let whereClause = {}

      // Si es reporte completo, mostrar todos los productos
      if (complete !== 'true') {
        // Si es reporte detallado, aplicar filtros adicionales
        // Filtro por precio de venta > 0 si no se especifica showAll
        if (showAll !== 'true') {
          whereClause.retailPrice = { [Op.gt]: 0 }
        }

        // Filtro por estado
        if (status !== 'all') {
          whereClause.status = status
        }

        // Filtro por categoría
        if (category) {
          whereClause.categoryId = category
        }

        // Filtro por stock
        if (stockFilter !== 'all') {
          switch (stockFilter) {
            case 'low':
              whereClause.currentStock = { [Op.lte]: 5, [Op.gt]: 0 }
              break
            case 'out':
              whereClause.currentStock = 0
              break
            case 'normal':
              whereClause.currentStock = { [Op.between]: [6, 100] }
              break
            case 'overstock':
              whereClause.currentStock = { [Op.gt]: 100 }
              break
          }
        }
      }

      const products = await Product.findAll({
        where: whereClause,
        attributes: [
          'id', 'name', 'internalCode', 'currentStock', 'costPrice', 'retailPrice', 'dollarPrice', 'status'
        ],
        order: [['name', 'ASC']]
      })

      // Obtener tasa actual del dólar
      const currentDolarRate = await DolarRate.findOne({
        order: [['date', 'DESC']]
      })

      const productsWithDetails = products.map(product => {
        const retailPriceBs = currentDolarRate ?
          parseFloat(product.retailPrice) * parseFloat(currentDolarRate.rate) : 0

        // Calcular colores para stock (igual que en reporte de inventario)
        let stockStatus = 'normal'
        let stockColor = 'green'

        const stock = parseInt(product.currentStock) || 0

        if (stock === 0) {
          stockStatus = 'agotado'
          stockColor = 'red'
        } else if (stock <= 5) {
          stockStatus = 'bajo'
          stockColor = 'orange'
        }

        return {
          id: product.id,
          name: product.name,
          internalCode: product.internalCode,
          currentStock: product.currentStock,
          costPrice: product.costPrice,
          retailPrice: product.retailPrice,
          dollarPrice: product.dollarPrice,
          status: product.status,
          stockStatus,
          stockColor,
          retailPriceBs: parseFloat(retailPriceBs.toFixed(2)),
          retailPriceUsd: parseFloat(parseFloat(product.retailPrice).toFixed(2)),
          costPriceBs: currentDolarRate ?
            parseFloat((parseFloat(product.costPrice) * parseFloat(currentDolarRate.rate)).toFixed(2)) : parseFloat((0).toFixed(2)),
          costPriceUsd: parseFloat(parseFloat(product.costPrice).toFixed(2)),
          totalValueBs: parseFloat((retailPriceBs * product.currentStock).toFixed(2)),
          totalValueUsd: parseFloat((parseFloat(product.retailPrice) * product.currentStock).toFixed(2))
        }
      })

      res.json({
        products: productsWithDetails,
        currentDolarRate: currentDolarRate ? parseFloat(currentDolarRate.rate) : null,
        isComplete: complete === 'true',
        isDetailed: complete === 'false',
        filters: { productId, complete, category, status, stockFilter },
        summary: {
          totalProducts: productsWithDetails.length,
          totalStock: parseFloat(productsWithDetails.reduce((sum, p) => sum + p.currentStock, 0).toFixed(2)),
          totalValueBs: parseFloat(productsWithDetails.reduce((sum, p) => sum + p.totalValueBs, 0).toFixed(2)),
          totalValueUsd: parseFloat(productsWithDetails.reduce((sum, p) => sum + p.totalValueUsd, 0).toFixed(2))
        }
      })
    } catch (error) {
      console.error("Error fetching product inventory report:", error)
      res.status(500).json({ error: error.message })
    }
  },

  // Reporte de Ventas Detallado por Lotes
  async getDetailedSalesReportByBatches(req, res) {
    try {
      const { startDate, endDate, batch } = req.query

      let whereClause = {}

      // Solo filtrar por status completada si no estamos en desarrollo
      if (process.env.NODE_ENV === 'production') {
        whereClause.status = "completada"
      }

      if (startDate && endDate) {
        // Convertir las fechas a objetos Date para asegurar compatibilidad
        const start = new Date(startDate + ' 00:00:00')
        const end = new Date(endDate + ' 23:59:59')

        whereClause.sale_date = {
          [Op.between]: [start, end],
        }
      }

      // Construir filtro para arqueos
      let reconciliationWhereClause = {}

      if (batch) {
        reconciliationWhereClause.lote = { [Op.like]: `%${batch}%` }
      }

      if (startDate && endDate) {
        // Filtrar arqueos por fecha de apertura usando el nombre real de la columna
        reconciliationWhereClause[Op.and] = [
          sequelize.literal(`DATE(opening_date) >= '${startDate}'`),
          sequelize.literal(`DATE(opening_date) <= '${endDate}'`)
        ]
      }

      // Obtener arqueos
      const reconciliations = await require('../database/models').CashReconciliation.findAll({
        where: reconciliationWhereClause,
        attributes: [
          'id', 'lote', 'openingDate', 'closingDate', 'totalSales', 'totalSalesUsd'
        ],
        order: [['opening_date', 'DESC']]
      })

      // Obtener ventas para estos arqueos
      const reconciliationIds = reconciliations.map(r => r.id)
      const sales = await require('../database/models').Sale.findAll({
        where: {
          reconciliationId: { [Op.in]: reconciliationIds },
          ...(Object.keys(whereClause).length > 0 ? whereClause : {})
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['username', 'first_name', 'last_name']
          },
          {
            model: DolarRate,
            as: 'dolarRate',
            attributes: ['rate']
          },
          {
            model: require('../database/models').SaleItem,
            as: 'items',
            include: [{
              model: require('../database/models').Product,
              as: 'product',
              attributes: ['name', 'internalCode', 'retailPrice']
            }],
            attributes: ['quantity', 'unitPriceBs', 'subtotalBs']
          },
          {
            model: require('../database/models').SalePayment,
            as: 'payments',
            include: [{
              model: require('../database/models').PaymentMethod,
              as: 'paymentMethod',
              attributes: ['name']
            }],
            attributes: ['amount', 'reference', 'notes']
          }
        ],
        attributes: [
          'id', 'saleNumber', 'totalUsd', 'totalBs', 'sale_date', 'paymentStatus',
          'changeGivenBs', 'changeGivenUsd', 'notes', 'reconciliationId'
        ]
      })

      // Agrupar ventas por reconciliationId
      const salesByReconciliation = sales.reduce((acc, sale) => {
        const recId = sale.reconciliationId
        if (!acc[recId]) acc[recId] = []
        acc[recId].push(sale)
        return acc
      }, {})

      const currentDolarRate = await DolarRate.findOne({
        order: [['date', 'DESC']]
      })

      // Procesar los arqueos con sus ventas
      const batchesWithSales = reconciliations.map(reconciliation => {
        const reconciliationData = reconciliation.toJSON()
        const reconciliationSales = salesByReconciliation[reconciliationData.id] || []

        // Procesar las ventas del arqueo
        const salesWithDetails = reconciliationSales.map(sale => {
          const saleData = sale.toJSON()
          const totalSoldBs = parseFloat(saleData.totalBs) - parseFloat(saleData.changeGivenBs || 0)
          const totalSoldUsd = totalSoldBs / (saleData.dolarRate?.rate || 1)

          return {
            ...saleData,
            totalBs: parseFloat(parseFloat(saleData.totalBs).toFixed(2)),
            totalUsd: parseFloat(parseFloat(saleData.totalUsd).toFixed(2)),
            totalSoldBs: parseFloat(totalSoldBs.toFixed(2)),
            totalSoldUsd: parseFloat(totalSoldUsd.toFixed(2)),
            changeGivenBs: parseFloat(parseFloat(saleData.changeGivenBs || 0).toFixed(2)),
            changeGivenUsd: parseFloat(parseFloat(saleData.changeGivenUsd || 0).toFixed(2)),
            saleDate: saleData.sale_date,
            userName: saleData.user ? `${saleData.user.first_name} ${saleData.user.last_name}` : 'Usuario Desconocido',
            dolarRateAtSale: parseFloat(parseFloat(saleData.dolarRate?.rate || 0).toFixed(2)),
            items: saleData.items ? saleData.items.map(item => ({
              productName: item.product?.name || 'Producto Desconocido',
              productCode: item.product?.internalCode || 'N/A',
              quantity: parseFloat(item.quantity),
              unitPriceBs: parseFloat(parseFloat(item.unitPriceBs).toFixed(2)),
              unitPriceUsd: parseFloat((parseFloat(item.unitPriceBs) / (saleData.dolarRate?.rate || 1)).toFixed(2)),
              subtotalBs: parseFloat(parseFloat(item.subtotalBs).toFixed(2)),
              subtotalUsd: parseFloat((parseFloat(item.subtotalBs) / (saleData.dolarRate?.rate || 1)).toFixed(2))
            })) : [],
            payments: saleData.payments ? saleData.payments.map(payment => ({
              methodName: payment.paymentMethod?.name || 'Método Desconocido',
              amount: parseFloat(parseFloat(payment.amount).toFixed(2)),
              amountUsd: parseFloat((parseFloat(payment.amount) / (saleData.dolarRate?.rate || 1)).toFixed(2)),
              reference: payment.reference || '',
              notes: payment.notes || ''
            })) : []
          }
        })

        // Calcular resumen del lote
        const batchSummary = {
          totalSales: salesWithDetails.length,
          totalAmountBs: parseFloat(salesWithDetails.reduce((sum, sale) => sum + sale.totalBs, 0).toFixed(2)),
          totalAmountUsd: parseFloat(salesWithDetails.reduce((sum, sale) => sum + sale.totalUsd, 0).toFixed(2)),
          totalSoldBs: parseFloat(salesWithDetails.reduce((sum, sale) => sum + sale.totalSoldBs, 0).toFixed(2)),
          totalSoldUsd: parseFloat(salesWithDetails.reduce((sum, sale) => sum + sale.totalSoldUsd, 0).toFixed(2)),
          totalChangeGivenBs: parseFloat(salesWithDetails.reduce((sum, sale) => sum + sale.changeGivenBs, 0).toFixed(2)),
          totalChangeGivenUsd: parseFloat(salesWithDetails.reduce((sum, sale) => sum + sale.changeGivenUsd, 0).toFixed(2))
        }

        return {
          ...reconciliationData,
          openingDate: reconciliationData.openingDate,
          closingDate: reconciliationData.closingDate,
          sales: salesWithDetails,
          summary: batchSummary
        }
      })

      // Calcular resumen general
      const overallSummary = {
        totalBatches: batchesWithSales.length,
        totalSales: batchesWithSales.reduce((sum, batch) => sum + batch.summary.totalSales, 0),
        totalAmountBs: parseFloat(batchesWithSales.reduce((sum, batch) => sum + batch.summary.totalAmountBs, 0).toFixed(2)),
        totalAmountUsd: parseFloat(batchesWithSales.reduce((sum, batch) => sum + batch.summary.totalAmountUsd, 0).toFixed(2)),
        totalSoldBs: parseFloat(batchesWithSales.reduce((sum, batch) => sum + batch.summary.totalSoldBs, 0).toFixed(2)),
        totalSoldUsd: parseFloat(batchesWithSales.reduce((sum, batch) => sum + batch.summary.totalSoldUsd, 0).toFixed(2)),
        totalChangeGivenBs: parseFloat(batchesWithSales.reduce((sum, batch) => sum + batch.summary.totalChangeGivenBs, 0).toFixed(2)),
        totalChangeGivenUsd: parseFloat(batchesWithSales.reduce((sum, batch) => sum + batch.summary.totalChangeGivenUsd, 0).toFixed(2))
      }

      // Construir respuesta manualmente sin objetos Sequelize
      const response = {
        batches: [],
        currentDolarRate: currentDolarRate ? parseFloat(currentDolarRate.rate) : null,
        filters: { startDate, endDate, batch },
        summary: {
          totalBatches: overallSummary.totalBatches,
          totalSales: overallSummary.totalSales,
          totalAmountBs: overallSummary.totalAmountBs,
          totalAmountUsd: overallSummary.totalAmountUsd,
          totalSoldBs: overallSummary.totalSoldBs,
          totalSoldUsd: overallSummary.totalSoldUsd,
          totalChangeGivenBs: overallSummary.totalChangeGivenBs,
          totalChangeGivenUsd: overallSummary.totalChangeGivenUsd
        }
      }

      // Procesar batches de manera segura
      for (const batch of batchesWithSales) {
        const safeBatch = {
          id: batch.id,
          lote: batch.lote,
          openingDate: batch.openingDate,
          closingDate: batch.closingDate,
          totalSales: batch.totalSales,
          totalSalesUsd: batch.totalSalesUsd,
          sales: [],
          summary: {
            totalSales: batch.summary.totalSales,
            totalAmountBs: batch.summary.totalAmountBs,
            totalAmountUsd: batch.summary.totalAmountUsd,
            totalSoldBs: batch.summary.totalSoldBs,
            totalSoldUsd: batch.summary.totalSoldUsd,
            totalChangeGivenBs: batch.summary.totalChangeGivenBs,
            totalChangeGivenUsd: batch.summary.totalChangeGivenUsd
          }
        }

        // Procesar ventas de manera segura
        for (const sale of batch.sales) {
          const safeSale = {
            id: sale.id,
            saleNumber: sale.saleNumber,
            totalUsd: sale.totalUsd,
            totalBs: sale.totalBs,
            sale_date: sale.sale_date,
            paymentStatus: sale.paymentStatus,
            changeGivenBs: sale.changeGivenBs,
            changeGivenUsd: sale.changeGivenUsd,
            notes: sale.notes,
            user: sale.user ? {
              username: sale.user.username,
              first_name: sale.user.first_name,
              last_name: sale.user.last_name
            } : null,
            dolarRate: sale.dolarRate ? { rate: sale.dolarRate.rate } : null,
            items: (sale.items || []).map(item => ({
              productName: item.productName,
              productCode: item.productCode,
              quantity: item.quantity,
              unitPriceBs: item.unitPriceBs,
              unitPriceUsd: item.unitPriceUsd,
              subtotalBs: item.subtotalBs,
              subtotalUsd: item.subtotalUsd
            })),
            payments: (sale.payments || []).map(payment => ({
              methodName: payment.methodName,
              amount: payment.amount,
              amountUsd: payment.amountUsd,
              reference: payment.reference,
              notes: payment.notes
            })),
            totalSoldBs: sale.totalSoldBs,
            totalSoldUsd: sale.totalSoldUsd,
            saleDate: sale.saleDate,
            userName: sale.userName,
            dolarRateAtSale: sale.dolarRateAtSale
          }
          safeBatch.sales.push(safeSale)
        }

        response.batches.push(safeBatch)
      }

      res.json(response)
    } catch (error) {
      console.error("Error fetching detailed sales report by batches:", error)
      res.status(500).json({ error: error.message })
    }
  },

  // Reporte Financiero de Ventas - Por fecha y productos
  async getFinancialSalesReport(req, res) {
    try {
      const { date, productId } = req.query

      let whereClause = {
        status: "completada"
      }

      if (date) {
        const targetDate = new Date(date)
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
        const endOfDay = new Date(startOfDay)
        endOfDay.setDate(endOfDay.getDate() + 1)

        whereClause.sale_date = {
          [Op.between]: [startOfDay, endOfDay],
        }
      }

      const salesItems = await SaleItem.findAll({
        include: [
          {
            model: Sale,
            as: 'sale',
            where: whereClause,
            attributes: ['saleNumber', 'sale_date', 'totalBs', 'totalUsd'],
            include: [
              {
                model: DolarRate,
                as: 'dolarRate',
                attributes: ['rate']
              }
            ]
          },
          {
            model: Product,
            as: 'product',
            where: productId ? { id: productId } : {},
            attributes: ['name', 'internalCode', 'retailPrice']
          }
        ],
        attributes: [
          'id', 'quantity', 'unitPriceBs', 'subtotalBs'
        ],
        order: [['sale', 'sale_date', 'DESC']]
      })

      // Obtener tasa actual del dólar
      const currentDolarRate = await DolarRate.findOne({
        order: [['date', 'DESC']]
      })

      const salesData = salesItems.map(item => {
        const rate = parseFloat(item.sale?.dolarRate?.rate || 1)
        const unitPriceBs = parseFloat(item.unitPriceBs)
        const subtotalBs = parseFloat(item.subtotalBs)

        return {
          saleNumber: item.sale ? item.sale.saleNumber : 'N/A',
          saleDate: item.sale ? item.sale.sale_date : new Date(),
          productName: item.product ? item.product.name : 'Producto Desconocido',
          productCode: item.product ? item.product.internalCode : 'N/A',
          quantity: parseFloat(item.quantity),
          unitPriceBs: parseFloat(unitPriceBs.toFixed(2)),
          unitPriceUsd: parseFloat((unitPriceBs / rate).toFixed(2)),
          subtotalBs: parseFloat(subtotalBs.toFixed(2)),
          subtotalUsd: parseFloat((subtotalBs / rate).toFixed(2)),
          totalBs: parseFloat(subtotalBs.toFixed(2)), // Para el item, el total es el subtotal
          totalUsd: parseFloat((subtotalBs / rate).toFixed(2)),
          dolarRateAtSale: parseFloat(rate.toFixed(2))
        }
      })

      // Agrupar por producto si no se especifica uno
      let groupedData = salesData
      if (!productId) {
        const grouped = salesData.reduce((acc, item) => {
          const key = item.productCode
          if (!acc[key]) {
            acc[key] = {
              productName: item.productName,
              productCode: item.productCode,
              quantity: 0, // Cambiado de totalQuantity a quantity para coincidir con headers
              unitPriceBs: 0, // Promedio o suma? En reporte agrupado, precio unitario puede variar.
              unitPriceUsd: 0,
              subtotalBs: 0,
              subtotalUsd: 0,
              totalBs: 0,
              totalUsd: 0,
              salesCount: 0,
              dolarRateAtSale: item.dolarRateAtSale // Mostrar la última o promedio?
            }
          }
          acc[key].quantity += item.quantity
          acc[key].subtotalBs += item.subtotalBs
          acc[key].subtotalUsd += item.subtotalUsd
          acc[key].totalBs += item.totalBs
          acc[key].totalUsd += item.totalUsd
          acc[key].salesCount += 1
          // Precio unitario promedio
          acc[key].unitPriceBs = acc[key].subtotalBs / acc[key].quantity
          acc[key].unitPriceUsd = acc[key].subtotalUsd / acc[key].quantity
          return acc
        }, {})

        groupedData = Object.values(grouped).map(item => ({
          ...item,
          unitPriceBs: parseFloat(item.unitPriceBs.toFixed(2)),
          unitPriceUsd: parseFloat(item.unitPriceUsd.toFixed(2)),
          subtotalBs: parseFloat(item.subtotalBs.toFixed(2)),
          subtotalUsd: parseFloat(item.subtotalUsd.toFixed(2)),
          totalBs: parseFloat(item.totalBs.toFixed(2)),
          totalUsd: parseFloat(item.totalUsd.toFixed(2))
        }))
      }

      res.json({
        sales: productId ? salesData : groupedData,
        currentDolarRate: currentDolarRate ? parseFloat(currentDolarRate.rate) : null,
        filters: { date, productId },
        summary: {
          totalSales: salesData.length,
          totalQuantity: parseFloat(salesData.reduce((sum, s) => sum + s.quantity, 0).toFixed(2)),
          totalBs: parseFloat(salesData.reduce((sum, s) => sum + s.subtotalBs, 0).toFixed(2)),
          totalUsd: parseFloat(salesData.reduce((sum, s) => sum + s.subtotalUsd, 0).toFixed(2))
        }
      })
    } catch (error) {
      console.error("Error fetching financial sales report:", error)
      res.status(500).json({ error: error.message })
    }
  }
}

module.exports = reportsController