const express = require("express")
const { Op } = require("sequelize")
const { Sale, SaleItem, Product, Customer, User, InventoryMovement } = require("../database/models")
const { sequelize } = require("../database/connection")
const { authenticateToken, requirePermission } = require("../middleware/auth")

const router = express.Router()

// Todas las rutas de reportes requieren autenticación
router.use(authenticateToken)

// Dashboard summary
router.get("/dashboard", requirePermission("reports"), async (req, res) => {
  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const sevenDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)

    // General stats
    const totalProducts = await Product.count()
    const totalCustomers = await Customer.count()
    const totalSales = await Sale.sum("total")
    const inventoryValueResult = await Product.findOne({
      attributes: [[sequelize.literal("SUM(current_stock * cost_price)"), "value"]],
      raw: true,
    })
    const inventoryValue = inventoryValueResult?.value

    // Sales today
    const todaySales = await Sale.sum("total", {
      where: { sale_date: { [Op.gte]: startOfDay } },
    })

    // Sales last 7 days for chart
    const salesLast7Days = await Sale.findAll({
      where: { sale_date: { [Op.gte]: sevenDaysAgo } },
      attributes: [
        [sequelize.fn("DATE", sequelize.col("sale_date")), "date"],
        [sequelize.fn("SUM", sequelize.col("total")), "total"],
      ],
      group: [sequelize.literal("DATE(sale_date)")],
      order: [[sequelize.literal("DATE(sale_date)"), "ASC"]],
    })

    // Alerts
    const lowStockProducts = await Product.findAll({
      where: {
        [Op.and]: [sequelize.literal("current_stock <= min_stock"), { status: "activo" }],
      },
      attributes: ["id", "name", "current_stock", "min_stock"],
      limit: 5,
    })

    // Quick summary
    const activeProducts = await Product.count({ where: { status: "activo" } })
    const activeCustomers = await Customer.count({ where: { is_active: true } })
    const lowStockCount = await Product.count({
      where: {
        [Op.and]: [sequelize.literal("current_stock <= min_stock"), { status: "activo" }],
      },
    })
    const pendingInvoices = await Sale.count({ where: { payment_status: "pendiente" } })

    // Recent sales
    const recentSales = await Sale.findAll({
      limit: 5,
      order: [["sale_date", "DESC"]],
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: [
            "first_name",
            "last_name",
            "company_name",
            [sequelize.literal("COALESCE(CONCAT(first_name, ' ', last_name), company_name)"), "name"],
          ],
        },
      ],
    })

    res.json({
      summary: {
        totalProducts,
        totalCustomers,
        totalSales: totalSales || 0,
        todaySales: todaySales || 0,
        inventoryValue: inventoryValue || 0,
      },
      salesLast7Days,
      lowStockProducts,
      quickSummary: {
        activeProducts,
        activeCustomers,
        lowStockCount,
        pendingInvoices,
      },
      recentSales,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    res.status(500).json({ error: "Failed to fetch dashboard data" })
  }
})

// Sales reports
router.get("/sales", requirePermission("reports"), async (req, res) => {
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

    // Sales
    const sales = await Sale.findAll({
      where: {
        sale_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [sequelize.literal(`DATE_FORMAT(sale_date, '${dateFormat}')`), "period"],
        [sequelize.fn("COUNT", sequelize.col("id")), "totalSales"],
        [sequelize.fn("SUM", sequelize.col("total")), "totalAmount"],
        [sequelize.fn("SUM", sequelize.col("tax_amount")), "totalTax"],
        [sequelize.fn("AVG", sequelize.col("total")), "averageTicket"],
      ],
      group: [sequelize.literal(`DATE_FORMAT(sale_date, '${dateFormat}')`)],
      order: [[sequelize.literal(`DATE_FORMAT(sale_date, '${dateFormat}')`), "ASC"]],
    })

    res.json(sales)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Product performance report
router.get("/products", requirePermission("reports"), async (req, res) => {
  try {
    const { startDate, endDate, limit = 20 } = req.query

    const productStats = await SaleItem.findAll({
      include: [
        {
          model: Sale,
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
          attributes: ["name", "categoryId", "cost_price", "retail_price"],
        },
      ],
      attributes: [
        "product_id",
        [sequelize.fn("SUM", sequelize.col("quantity")), "totalSold"],
        [sequelize.fn("SUM", sequelize.col("SaleItem.total")), "totalRevenue"],
        [sequelize.fn("AVG", sequelize.col("SaleItem.unit_price")), "averagePrice"],
        [sequelize.fn("COUNT", sequelize.col("Sale.id")), "transactionCount"],
      ],
      group: ["product_id", "Product.id"],
      order: [[sequelize.fn("SUM", sequelize.col("SaleItem.total")), "DESC"]],
      limit: Number.parseInt(limit),
    })

    res.json(productStats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Inventory report
router.get("/inventory", requirePermission("reports"), async (req, res) => {
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
        "min_stock",
        "max_stock",
        "cost_price",
        "retail_price",
      ],
      order: [["name", "ASC"]],
    })

    // Filter by stock status
    let filteredProducts = products
    if (status === "low") {
      filteredProducts = products.filter((p) => p.current_stock <= p.min_stock)
    } else if (status === "out") {
      filteredProducts = products.filter((p) => p.current_stock === 0)
    } else if (status === "overstock") {
      filteredProducts = products.filter((p) => p.current_stock > p.max_stock)
    }

    // Calculate inventory value
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
})

// Financial report
router.get("/financial", requirePermission("reports"), async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    // Sales revenue
    const salesData = await Sale.findOne({
      where: {
        sale_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [sequelize.fn("SUM", sequelize.col("subtotal")), "totalRevenue"],
        [sequelize.fn("SUM", sequelize.col("tax_amount")), "totalTax"],
        [sequelize.fn("SUM", sequelize.col("total")), "totalSales"],
        [sequelize.fn("COUNT", sequelize.col("id")), "transactionCount"],
      ],
    })

    // Cost of goods sold
    const costData = await SaleItem.findOne({
      include: [
        {
          model: Sale,
          where: {
            sale_date: {
              [Op.between]: [startDate, endDate],
            },
          },
          attributes: [],
        },
        {
          model: Product,
          attributes: [],
        },
      ],
      attributes: [[sequelize.literal("SUM(SaleItem.quantity * Product.cost_price)"), "totalCost"]],
    })

    // Payment methods breakdown
    const paymentMethods = await Sale.findAll({
      where: {
        sale_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        "payment_method",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("total")), "total"],
      ],
      group: ["payment_method"],
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
      tax: Number.parseFloat(salesData?.dataValues?.totalTax || 0),
      totalSales: Number.parseFloat(salesData?.dataValues?.totalSales || 0),
      transactionCount: Number.parseInt(salesData?.dataValues?.transactionCount || 0),
      paymentMethods,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// User activity report
router.get("/users", requirePermission("reports"), async (req, res) => {
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
        [sequelize.fn("SUM", sequelize.col("total")), "totalAmount"],
        [sequelize.fn("AVG", sequelize.col("total")), "averageTicket"],
      ],
      group: ["user_id", "User.id"],
      order: [[sequelize.fn("SUM", sequelize.col("total")), "DESC"]],
    })

    res.json(userActivity)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
