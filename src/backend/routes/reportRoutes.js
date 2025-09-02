const express = require('express')
const { Sale, SaleDetail, Product, Customer, User } = require('../models')
const { validateToken, checkPermission } = require('../middleware/auth')
const { Op } = require('sequelize')

const router = express.Router()

// GET /api/reports/sales - Reporte de ventas
router.get('/sales', validateToken, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      customer_id, 
      user_id, 
      sale_type,
      payment_status,
      group_by = 'day'
    } = req.query
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de inicio y fin son requeridas'
      })
    }
    
    const where = {
      created_at: {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      },
      is_cancelled: false
    }
    
    if (customer_id) {
      where.customer_id = customer_id
    }
    
    if (user_id) {
      where.user_id = user_id
    }
    
    if (sale_type) {
      where.sale_type = sale_type
    }
    
    if (payment_status) {
      where.payment_status = payment_status
    }
    
    let groupByClause
    let dateFormat
    
    switch (group_by) {
      case 'day':
        groupByClause = Product.sequelize.fn('DATE', Product.sequelize.col('created_at'))
        dateFormat = '%Y-%m-%d'
        break
      case 'week':
        groupByClause = Product.sequelize.fn('YEARWEEK', Product.sequelize.col('created_at'))
        dateFormat = '%Y-%u'
        break
      case 'month':
        groupByClause = Product.sequelize.fn('DATE_FORMAT', Product.sequelize.col('created_at'), '%Y-%m')
        dateFormat = '%Y-%m'
        break
      default:
        groupByClause = Product.sequelize.fn('DATE', Product.sequelize.col('created_at'))
        dateFormat = '%Y-%m-%d'
    }
    
    const salesReport = await Sale.findAll({
      where,
      attributes: [
        [groupByClause, 'period'],
        [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'total_sales'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('subtotal')), 'total_subtotal'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('tax_amount')), 'total_taxes'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('discount_amount')), 'total_discounts'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('total')), 'total_amount'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('paid_amount')), 'total_paid']
      ],
      group: ['period'],
      order: [[groupByClause, 'ASC']]
    })
    
    // Obtener totales generales
    const totals = await Sale.findOne({
      where,
      attributes: [
        [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'total_sales'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('subtotal')), 'total_subtotal'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('tax_amount')), 'total_taxes'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('discount_amount')), 'total_discounts'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('total')), 'total_amount'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('paid_amount')), 'total_paid']
      ]
    })
    
    res.json({
      success: true,
      data: {
        period: {
          start_date,
          end_date,
          group_by
        },
        report: salesReport,
        totals: {
          total_sales: parseInt(totals.dataValues.total_sales || 0),
          total_subtotal: parseFloat(totals.dataValues.total_subtotal || 0),
          total_taxes: parseFloat(totals.dataValues.total_taxes || 0),
          total_discounts: parseFloat(totals.dataValues.total_discounts || 0),
          total_amount: parseFloat(totals.dataValues.total_amount || 0),
          total_paid: parseFloat(totals.dataValues.total_paid || 0),
          total_pending: parseFloat(totals.dataValues.total_amount || 0) - parseFloat(totals.dataValues.total_paid || 0)
        }
      }
    })
    
  } catch (error) {
    console.error('Error al generar reporte de ventas:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/reports/products - Reporte de productos más vendidos
router.get('/products', validateToken, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      limit = 20,
      category_id,
      brand
    } = req.query
    
    const where = {}
    
    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      }
    }
    
    if (category_id) {
      where['$product.category_id$'] = category_id
    }
    
    if (brand) {
      where['$product.brand$'] = { [Op.like]: `%${brand}%` }
    }
    
    const topProducts = await SaleDetail.findAll({
      where,
      attributes: [
        'product_id',
        [Product.sequelize.fn('SUM', Product.sequelize.col('quantity')), 'total_quantity'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('subtotal')), 'total_subtotal'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('total')), 'total_sales'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('profit')), 'total_profit'],
        [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'sales_count']
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'code', 'brand', 'unit', 'stock_quantity', 'cost_price', 'retail_price']
        },
        {
          model: Sale,
          as: 'sale',
          attributes: [],
          where: { is_cancelled: false }
        }
      ],
      group: ['product_id'],
      order: [[Product.sequelize.fn('SUM', Product.sequelize.col('total')), 'DESC']],
      limit: parseInt(limit)
    })
    
    // Calcular totales
    const totals = topProducts.reduce((acc, item) => ({
      total_quantity: acc.total_quantity + parseFloat(item.dataValues.total_quantity || 0),
      total_sales: acc.total_sales + parseFloat(item.dataValues.total_sales || 0),
      total_profit: acc.total_profit + parseFloat(item.dataValues.total_profit || 0),
      total_sales_count: acc.total_sales_count + parseInt(item.dataValues.sales_count || 0)
    }), {
      total_quantity: 0,
      total_sales: 0,
      total_profit: 0,
      total_sales_count: 0
    })
    
    res.json({
      success: true,
      data: {
        period: start_date && end_date ? { start_date, end_date } : null,
        products: topProducts,
        totals
      }
    })
    
  } catch (error) {
    console.error('Error al generar reporte de productos:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/reports/profit - Reporte de utilidades
router.get('/profit', validateToken, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de inicio y fin son requeridas'
      })
    }
    
    const where = {
      created_at: {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      }
    }
    
    let groupByClause
    
    switch (group_by) {
      case 'day':
        groupByClause = Product.sequelize.fn('DATE', Product.sequelize.col('created_at'))
        break
      case 'week':
        groupByClause = Product.sequelize.fn('YEARWEEK', Product.sequelize.col('created_at'))
        break
      case 'month':
        groupByClause = Product.sequelize.fn('DATE_FORMAT', Product.sequelize.col('created_at'), '%Y-%m')
        break
      default:
        groupByClause = Product.sequelize.fn('DATE', Product.sequelize.col('created_at'))
    }
    
    const profitReport = await SaleDetail.findAll({
      where,
      attributes: [
        [groupByClause, 'period'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('subtotal')), 'total_subtotal'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('discount_amount')), 'total_discounts'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('tax_amount')), 'total_taxes'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('total')), 'total_sales'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('profit')), 'total_profit']
      ],
      include: [
        {
          model: Sale,
          as: 'sale',
          attributes: [],
          where: { is_cancelled: false }
        }
      ],
      group: ['period'],
      order: [[groupByClause, 'ASC']]
    })
    
    // Calcular totales y márgenes
    const totals = profitReport.reduce((acc, item) => ({
      total_subtotal: acc.total_subtotal + parseFloat(item.dataValues.total_subtotal || 0),
      total_discounts: acc.total_discounts + parseFloat(item.dataValues.total_discounts || 0),
      total_taxes: acc.total_taxes + parseFloat(item.dataValues.total_taxes || 0),
      total_sales: acc.total_sales + parseFloat(item.dataValues.total_sales || 0),
      total_profit: acc.total_profit + parseFloat(item.dataValues.total_profit || 0)
    }), {
      total_subtotal: 0,
      total_discounts: 0,
      total_taxes: 0,
      total_sales: 0,
      total_profit: 0
    })
    
    const profitMargin = totals.total_sales > 0 ? (totals.total_profit / totals.total_sales) * 100 : 0
    
    res.json({
      success: true,
      data: {
        period: {
          start_date,
          end_date,
          group_by
        },
        report: profitReport,
        totals: {
          ...totals,
          profit_margin_percentage: parseFloat(profitMargin.toFixed(2))
        }
      }
    })
    
  } catch (error) {
    console.error('Error al generar reporte de utilidades:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/reports/customers - Reporte de ventas por cliente
router.get('/customers', validateToken, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      limit = 20,
      category,
      has_balance
    } = req.query
    
    const where = {
      is_cancelled: false
    }
    
    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      }
    }
    
    if (has_balance === 'true') {
      where['$customer.current_balance$'] = {
        [Op.gt]: 0
      }
    }
    
    const customerWhere = {}
    if (category) {
      customerWhere.category = category
    }
    
    const customerSales = await Sale.findAll({
      where,
      attributes: [
        'customer_id',
        [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'total_sales'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('subtotal')), 'total_subtotal'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('total')), 'total_amount'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('paid_amount')), 'total_paid']
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          where: customerWhere,
          attributes: ['id', 'name', 'business_name', 'identification', 'category', 'current_balance', 'credit_limit']
        }
      ],
      group: ['customer_id'],
      order: [[Product.sequelize.fn('SUM', Product.sequelize.col('total')), 'DESC']],
      limit: parseInt(limit)
    })
    
    // Calcular totales
    const totals = customerSales.reduce((acc, item) => ({
      total_customers: acc.total_customers + 1,
      total_sales: acc.total_sales + parseInt(item.dataValues.total_sales || 0),
      total_amount: acc.total_amount + parseFloat(item.dataValues.total_amount || 0),
      total_paid: acc.total_paid + parseFloat(item.dataValues.total_paid || 0),
      total_pending: acc.total_pending + (parseFloat(item.dataValues.total_amount || 0) - parseFloat(item.dataValues.total_paid || 0))
    }), {
      total_customers: 0,
      total_sales: 0,
      total_amount: 0,
      total_paid: 0,
      total_pending: 0
    })
    
    res.json({
      success: true,
      data: {
        period: start_date && end_date ? { start_date, end_date } : null,
        customers: customerSales,
        totals
      }
    })
    
  } catch (error) {
    console.error('Error al generar reporte de clientes:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/reports/inventory - Reporte completo de inventario
router.get('/inventory', validateToken, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { category_id, brand, low_stock_only = false } = req.query
    
    const where = { is_active: true }
    
    if (category_id) {
      where.category_id = category_id
    }
    
    if (brand) {
      where.brand = { [Op.like]: `%${brand}%` }
    }
    
    if (low_stock_only === 'true') {
      where.stock_quantity = {
        [Op.lte]: { [Op.col]: 'min_stock' }
      }
    }
    
    const products = await Product.findAll({
      where,
      attributes: [
        'id',
        'name',
        'code',
        'brand',
        'category_id',
        'stock_quantity',
        'min_stock',
        'max_stock',
        'cost_price',
        'retail_price',
        'wholesale_price',
        'unit'
      ],
      order: [['name', 'ASC']]
    })
    
    // Calcular estadísticas
    const stats = products.reduce((acc, product) => {
      const costValue = product.stock_quantity * product.cost_price
      const retailValue = product.stock_quantity * product.retail_price
      const wholesaleValue = product.stock_quantity * (product.wholesale_price || product.retail_price)
      
      return {
        total_products: acc.total_products + 1,
        total_stock: acc.total_stock + product.stock_quantity,
        total_cost_value: acc.total_cost_value + costValue,
        total_retail_value: acc.total_retail_value + retailValue,
        total_wholesale_value: acc.total_wholesale_value + wholesaleValue,
        low_stock_count: acc.low_stock_count + (product.stock_quantity <= product.min_stock ? 1 : 0),
        out_of_stock_count: acc.out_of_stock_count + (product.stock_quantity === 0 ? 1 : 0)
      }
    }, {
      total_products: 0,
      total_stock: 0,
      total_cost_value: 0,
      total_retail_value: 0,
      total_wholesale_value: 0,
      low_stock_count: 0,
      out_of_stock_count: 0
    })
    
    stats.potential_profit = stats.total_retail_value - stats.total_cost_value
    stats.profit_margin = stats.total_retail_value > 0 ? (stats.potential_profit / stats.total_retail_value) * 100 : 0
    
    res.json({
      success: true,
      data: {
        products,
        statistics: stats
      }
    })
    
  } catch (error) {
    console.error('Error al generar reporte de inventario:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/reports/dashboard - Dashboard con métricas principales
router.get('/dashboard', validateToken, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // Ventas del día
    const todaySales = await Sale.findAll({
      where: {
        created_at: {
          [Op.between]: [startOfDay, endOfDay]
        },
        is_cancelled: false
      },
      attributes: [
        [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'total_sales'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('total')), 'total_amount'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('paid_amount')), 'total_paid']
      ]
    })
    
    // Ventas de los últimos 30 días
    const monthlySales = await Sale.findAll({
      where: {
        created_at: {
          [Op.gte]: thirtyDaysAgo
        },
        is_cancelled: false
      },
      attributes: [
        [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'total_sales'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('total')), 'total_amount'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('paid_amount')), 'total_paid']
      ]
    })
    
    // Productos con stock bajo
    const lowStockProducts = await Product.count({
      where: {
        is_active: true,
        stock_quantity: {
          [Op.lte]: { [Op.col]: 'min_stock' }
        }
      }
    })
    
    // Pagos pendientes
    const pendingPayments = await Sale.count({
      where: {
        payment_status: {
          [Op.in]: ['pendiente', 'parcial']
        },
        is_cancelled: false
      }
    })
    
    // Productos más vendidos del día
    const topProductsToday = await SaleDetail.findAll({
      where: {
        created_at: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      attributes: [
        'product_id',
        [Product.sequelize.fn('SUM', Product.sequelize.col('quantity')), 'total_quantity'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('total')), 'total_sales']
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Sale,
          as: 'sale',
          attributes: [],
          where: { is_cancelled: false }
        }
      ],
      group: ['product_id'],
      order: [[Product.sequelize.fn('SUM', Product.sequelize.col('total')), 'DESC']],
      limit: 5
    })
    
    res.json({
      success: true,
      data: {
        today: {
          sales: parseInt(todaySales[0]?.dataValues?.total_sales || 0),
          amount: parseFloat(todaySales[0]?.dataValues?.total_amount || 0),
          paid: parseFloat(todaySales[0]?.dataValues?.total_paid || 0)
        },
        monthly: {
          sales: parseInt(monthlySales[0]?.dataValues?.total_sales || 0),
          amount: parseFloat(monthlySales[0]?.dataValues?.total_amount || 0),
          paid: parseFloat(monthlySales[0]?.dataValues?.total_paid || 0)
        },
        alerts: {
          low_stock_products: lowStockProducts,
          pending_payments: pendingPayments
        },
        top_products_today: topProductsToday
      }
    })
    
  } catch (error) {
    console.error('Error al generar dashboard:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

module.exports = router
