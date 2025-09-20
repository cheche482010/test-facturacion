const express = require("express")
const { Sale, SaleItem, Product, Customer, User, InventoryMovement, sequelize } = require("../database/models")
const { authenticateToken, requirePermission } = require("../middleware/auth")

const router = express.Router()

// Dashboard summary
router.get("/dashboard", authenticateToken, requirePermission("reports"), async (req, res) => {
  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfYear = new Date(today.getFullYear(), 0, 1)

    // Today's sales
    const todaySales = await Sale.findOne({
      where: {
        saleDate: {
          [sequelize.Op.gte]: startOfDay,
        },
      },
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("total")), "total"],
      ],
    })

    // Monthly sales
    const monthlySales = await Sale.findOne({
      where: {
        saleDate: {
          [sequelize.Op.gte]: startOfMonth,
        },
      },
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("total")), "total"],
      ],
    })

    // Low stock products
    const lowStockProducts = await Product.findAll({
      where: {
        stock: {
          [sequelize.Op.lte]: sequelize.col("minStock"),
        },
        isActive: true,
      },
      attributes: ["id", "name", "stock", "minStock"],
      limit: 10,
    })

    // Top selling products this month
    const topProducts = await SaleItem.findAll({
      include: [
        {
          model: Sale,
          where: {
            saleDate: {
              [sequelize.Op.gte]: startOfMonth,
            },
          },
          attributes: [],
        },
        {
          model: Product,
          attributes: ["name"],
        },
      ],
      attributes: [
        "productId",
        [sequelize.fn("SUM", sequelize.col("quantity")), "totalSold"],
        [sequelize.fn("SUM", sequelize.col("SaleItem.total")), "totalRevenue"],
      ],
      group: ["productId", "Product.id"],
      order: [[sequelize.fn("SUM", sequelize.col("quantity")), "DESC"]],
      limit: 5,
    })

    res.json({
      todaySales: {
        count: Number.parseInt(todaySales?.dataValues?.count || 0),
        total: Number.parseFloat(todaySales?.dataValues?.total || 0),
      },
      monthlySales: {
        count: Number.parseInt(monthlySales?.dataValues?.count || 0),
        total: Number.parseFloat(monthlySales?.dataValues?.total || 0),
      },
      lowStockProducts,
      topProducts,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Sales reports
router.get("/sales", authenticateToken, requirePermission("reports"), async (req, res) => {
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
        saleDate: {
          [sequelize.Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [sequelize.fn("DATE_FORMAT", sequelize.col("sale_date"), dateFormat), "period"],
        [sequelize.fn("COUNT", sequelize.col("id")), "totalSales"],
        [sequelize.fn("SUM", sequelize.col("total")), "totalAmount"],
        [sequelize.fn("SUM", sequelize.col("tax")), "totalTax"],
        [sequelize.fn("AVG", sequelize.col("total")), "averageTicket"],
      ],
      group: [sequelize.fn("DATE_FORMAT", sequelize.col("sale_date"), dateFormat)],
      order: [[sequelize.fn("DATE_FORMAT", sequelize.col("sale_date"), dateFormat), "ASC"]],
    })

    res.json(sales)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Product performance report
router.get("/products", authenticateToken, requirePermission("reports"), async (req, res) => {
  try {
    const { startDate, endDate, limit = 20 } = req.query

    const productStats = await SaleItem.findAll({
      include: [
        {
          model: Sale,
          where:
            startDate && endDate
              ? {
                  saleDate: {
                    [sequelize.Op.between]: [startDate, endDate],
                  },
                }
              : {},
          attributes: [],
        },
        {
          model: Product,
          attributes: ["name", "category", "cost", "price"],
        },
      ],
      attributes: [
        "productId",
        [sequelize.fn("SUM", sequelize.col("quantity")), "totalSold"],
        [sequelize.fn("SUM", sequelize.col("SaleItem.total")), "totalRevenue"],
        [sequelize.fn("AVG", sequelize.col("SaleItem.unitPrice")), "averagePrice"],
        [sequelize.fn("COUNT", sequelize.col("Sale.id")), "transactionCount"],
      ],
      group: ["productId", "Product.id"],
      order: [[sequelize.fn("SUM", sequelize.col("SaleItem.total")), "DESC"]],
      limit: Number.parseInt(limit),
    })

    res.json(productStats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Inventory report
router.get("/inventory", authenticateToken, requirePermission("reports"), async (req, res) => {
  try {
    const { category, status = "all" } = req.query

    const whereClause = { isActive: true }
    if (category) {
      whereClause.category = category
    }

    const products = await Product.findAll({
      where: whereClause,
      attributes: ["id", "name", "category", "stock", "minStock", "maxStock", "cost", "price", "lastRestockDate"],
      order: [["name", "ASC"]],
    })

    // Filter by stock status
    let filteredProducts = products
    if (status === "low") {
      filteredProducts = products.filter((p) => p.stock <= p.minStock)
    } else if (status === "out") {
      filteredProducts = products.filter((p) => p.stock === 0)
    } else if (status === "overstock") {
      filteredProducts = products.filter((p) => p.stock > p.maxStock)
    }

    // Calculate inventory value
    const inventoryValue = filteredProducts.reduce((total, product) => {
      return total + product.stock * product.cost
    }, 0)

    const inventoryRetailValue = filteredProducts.reduce((total, product) => {
      return total + product.stock * product.price
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
router.get("/financial", authenticateToken, requirePermission("reports"), async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    // Sales revenue
    const salesData = await Sale.findOne({
      where: {
        saleDate: {
          [sequelize.Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [sequelize.fn("SUM", sequelize.col("subtotal")), "totalRevenue"],
        [sequelize.fn("SUM", sequelize.col("tax")), "totalTax"],
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
            saleDate: {
              [sequelize.Op.between]: [startDate, endDate],
            },
          },
          attributes: [],
        },
        {
          model: Product,
          attributes: [],
        },
      ],
      attributes: [[sequelize.fn("SUM", sequelize.literal("SaleItem.quantity * Product.cost")), "totalCost"]],
    })

    // Payment methods breakdown
    const paymentMethods = await Sale.findAll({
      where: {
        saleDate: {
          [sequelize.Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        "paymentMethod",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("total")), "total"],
      ],
      group: ["paymentMethod"],
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
router.get("/users", authenticateToken, requirePermission("reports"), async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const userActivity = await Sale.findAll({
      where:
        startDate && endDate
          ? {
              saleDate: {
                [sequelize.Op.between]: [startDate, endDate],
              },
            }
          : {},
      include: [
        {
          model: User,
          attributes: ["username", "firstName", "lastName"],
        },
      ],
      attributes: [
        "userId",
        [sequelize.fn("COUNT", sequelize.col("Sale.id")), "totalSales"],
        [sequelize.fn("SUM", sequelize.col("total")), "totalAmount"],
        [sequelize.fn("AVG", sequelize.col("total")), "averageTicket"],
      ],
      group: ["userId", "User.id"],
      order: [[sequelize.fn("SUM", sequelize.col("total")), "DESC"]],
    })

    res.json(userActivity)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
