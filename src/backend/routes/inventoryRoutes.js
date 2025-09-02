

const express = require('express')
const { Product, SaleDetail, Sale } = require('../models')
const { validateToken, checkPermission } = require('../middleware/auth')
const { Op } = require('sequelize')

const router = express.Router()

// GET /api/inventory - Resumen del inventario
router.get('/', validateToken, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    // Obtener estadísticas generales
    const totalProducts = await Product.count({ where: { is_active: true } })
    const lowStockProducts = await Product.count({
      where: {
        is_active: true,
        stock_quantity: {
          [Op.lte]: { [Op.col]: 'min_stock' }
        }
      }
    })
    
    const totalStockValue = await Product.sum('stock_quantity * cost_price', {
      where: { is_active: true }
    })
    
    const totalRetailValue = await Product.sum('stock_quantity * retail_price', {
      where: { is_active: true }
    })
    
    // Productos más vendidos (últimos 30 días)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const topProducts = await SaleDetail.findAll({
      where: {
        created_at: {
          [Op.gte]: thirtyDaysAgo
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
          attributes: ['id', 'name', 'code', 'stock_quantity']
        },
        {
          model: Sale,
          as: 'sale',
          attributes: [],
          where: { is_cancelled: false }
        }
      ],
      group: ['product_id'],
      order: [[Product.sequelize.fn('SUM', Product.sequelize.col('quantity')), 'DESC']],
      limit: 10
    })
    
    res.json({
      success: true,
      data: {
        summary: {
          total_products: totalProducts,
          low_stock_products: lowStockProducts,
          total_stock_value: totalStockValue || 0,
          total_retail_value: totalRetailValue || 0,
          potential_profit: (totalRetailValue || 0) - (totalStockValue || 0)
        },
        top_products: topProducts
      }
    })
    
  } catch (error) {
    console.error('Error al obtener resumen de inventario:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/inventory/low-stock - Productos con stock bajo
router.get('/low-stock', validateToken, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const { limit = 50 } = req.query
    
    const products = await Product.findAll({
      where: {
        is_active: true,
        stock_quantity: {
          [Op.lte]: { [Op.col]: 'min_stock' }
        }
      },
      order: [
        [Product.sequelize.literal('(min_stock - stock_quantity)'), 'DESC']
      ],
      limit: parseInt(limit)
    })
    
    res.json({
      success: true,
      data: products
    })
    
  } catch (error) {
    console.error('Error al obtener productos con stock bajo:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/inventory/adjustment - Ajuste individual de inventario
router.post('/adjustment', validateToken, checkPermission('inventory', 'update'), async (req, res) => {
  try {
    const { product_id, quantity, type, reason, notes = '' } = req.body
    
    if (!product_id || !quantity || !type || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Producto, cantidad, tipo y razón son requeridos'
      })
    }
    
    const validTypes = ['entrada', 'salida', 'ajuste']
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de ajuste inválido'
      })
    }
    
    const product = await Product.findByPk(product_id)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      })
    }
    
    const oldStock = product.stock_quantity
    let newStock = oldStock
    
    switch (type) {
      case 'entrada':
        newStock = oldStock + quantity
        break
      case 'salida':
        if (oldStock < quantity) {
          return res.status(400).json({
            success: false,
            message: 'Stock insuficiente para la salida'
          })
        }
        newStock = oldStock - quantity
        break
      case 'ajuste':
        newStock = quantity
        break
    }
    
    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'El stock no puede ser negativo'
      })
    }
    
    await product.updateStock(newStock, 'set')
    
    // Aquí podrías registrar el movimiento en una tabla de historial
    
    res.json({
      success: true,
      message: 'Ajuste de inventario realizado exitosamente',
      data: {
        product_id: product.id,
        product_name: product.name,
        old_stock: oldStock,
        new_stock: newStock,
        adjustment: newStock - oldStock,
        type: type,
        reason: reason
      }
    })
    
  } catch (error) {
    console.error('Error al realizar ajuste de inventario:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/inventory/bulk-adjustment - Ajuste masivo de inventario
router.post('/bulk-adjustment', validateToken, checkPermission('inventory', 'update'), async (req, res) => {
  try {
    const { adjustments, reason = 'Ajuste masivo' } = req.body
    
    if (!Array.isArray(adjustments) || adjustments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de ajustes requerida'
      })
    }
    
    const results = []
    
    for (const adjustment of adjustments) {
      try {
        const { product_id, quantity, type } = adjustment
        
        if (!product_id || !quantity || !type) {
          results.push({
            product_id,
            success: false,
            error: 'Datos incompletos'
          })
          continue
        }
        
        const product = await Product.findByPk(product_id)
        
        if (!product) {
          results.push({
            product_id,
            success: false,
            error: 'Producto no encontrado'
          })
          continue
        }
        
        const oldStock = product.stock_quantity
        let newStock = oldStock
        
        switch (type) {
          case 'entrada':
            newStock = oldStock + quantity
            break
          case 'salida':
            if (oldStock < quantity) {
              results.push({
                product_id,
                success: false,
                error: 'Stock insuficiente'
              })
              continue
            }
            newStock = oldStock - quantity
            break
          case 'ajuste':
            newStock = quantity
            break
          default:
            results.push({
              product_id,
              success: false,
              error: 'Tipo de ajuste inválido'
            })
            continue
        }
        
        if (newStock < 0) {
          results.push({
            product_id,
            success: false,
            error: 'Stock no puede ser negativo'
          })
          continue
        }
        
        await product.updateStock(newStock, 'set')
        
        results.push({
          product_id,
          success: true,
          old_stock: oldStock,
          new_stock: newStock,
          adjustment: newStock - oldStock
        })
        
      } catch (error) {
        results.push({
          product_id: adjustment.product_id,
          success: false,
          error: error.message
        })
      }
    }
    
    res.json({
      success: true,
      message: 'Ajuste masivo completado',
      data: results
    })
    
  } catch (error) {
    console.error('Error en ajuste masivo:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/inventory/movement/:product_id - Historial de movimientos de un producto
router.get('/movement/:product_id', validateToken, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const { product_id } = req.params
    const { start_date, end_date, page = 1, limit = 20 } = req.query
    
    const product = await Product.findByPk(product_id)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      })
    }
    
    const where = { product_id }
    
    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      }
    }
    
    const offset = (page - 1) * limit
    
    // Obtener ventas del producto
    const { count, rows } = await SaleDetail.findAndCountAll({
      where,
      include: [
        {
          model: Sale,
          as: 'sale',
          attributes: ['id', 'invoice_number', 'created_at', 'customer_id'],
          where: { is_cancelled: false }
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    })
    
    res.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          code: product.code,
          current_stock: product.stock_quantity,
          min_stock: product.min_stock
        },
        movements: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    })
    
  } catch (error) {
    console.error('Error al obtener movimientos:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/inventory/valuation - Valorización del inventario
router.get('/valuation', validateToken, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const { category_id, brand } = req.query
    
    const where = { is_active: true }
    
    if (category_id) {
      where.category_id = category_id
    }
    
    if (brand) {
      where.brand = { [Op.like]: `%${brand}%` }
    }
    
    const products = await Product.findAll({
      where,
      attributes: [
        'id',
        'name',
        'code',
        'brand',
        'stock_quantity',
        'cost_price',
        'retail_price',
        'wholesale_price'
      ],
      order: [['name', 'ASC']]
    })
    
    const valuation = products.map(product => ({
      id: product.id,
      name: product.name,
      code: product.code,
      brand: product.brand,
      stock_quantity: product.stock_quantity,
      cost_value: product.stock_quantity * product.cost_price,
      retail_value: product.stock_quantity * product.retail_price,
      wholesale_value: product.stock_quantity * (product.wholesale_price || product.retail_price),
      potential_profit: (product.stock_quantity * product.retail_price) - (product.stock_quantity * product.cost_price)
    }))
    
    const totals = valuation.reduce((acc, item) => ({
      total_cost: acc.total_cost + item.cost_value,
      total_retail: acc.total_retail + item.retail_value,
      total_wholesale: acc.total_wholesale + item.wholesale_value,
      total_profit: acc.total_profit + item.potential_profit
    }), {
      total_cost: 0,
      total_retail: 0,
      total_wholesale: 0,
      total_profit: 0
    })
    
    res.json({
      success: true,
      data: {
        products: valuation,
        totals
      }
    })
    
  } catch (error) {
    console.error('Error al obtener valorización:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/inventory/rotation - Análisis de rotación de inventario
router.get('/rotation', validateToken, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const { days = 30 } = req.query
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(days))
    
    // Obtener productos con sus ventas en el período
    const products = await Product.findAll({
      where: { is_active: true },
      attributes: [
        'id',
        'name',
        'code',
        'stock_quantity',
        'min_stock',
        'max_stock'
      ],
      include: [
        {
          model: SaleDetail,
          as: 'saleDetails',
          attributes: [
            [Product.sequelize.fn('SUM', Product.sequelize.col('saleDetails.quantity')), 'total_sold'],
            [Product.sequelize.fn('COUNT', Product.sequelize.col('saleDetails.id')), 'sales_count']
          ],
          where: {
            created_at: {
              [Op.gte]: startDate
            }
          },
          include: [
            {
              model: Sale,
              as: 'sale',
              attributes: [],
              where: { is_cancelled: false }
            }
          ]
        }
      ],
      group: ['Product.id'],
      order: [[Product.sequelize.fn('SUM', Product.sequelize.col('saleDetails.quantity')), 'DESC']]
    })
    
    const rotationAnalysis = products.map(product => {
      const totalSold = parseFloat(product.saleDetails[0]?.dataValues?.total_sold || 0)
      const salesCount = parseInt(product.saleDetails[0]?.dataValues?.sales_count || 0)
      const avgDailySales = totalSold / parseInt(days)
      const daysOfStock = product.stock_quantity > 0 ? product.stock_quantity / avgDailySales : 0
      
      let rotationCategory = 'lento'
      if (daysOfStock <= 7) rotationCategory = 'rápido'
      else if (daysOfStock <= 30) rotationCategory = 'normal'
      
      return {
        id: product.id,
        name: product.name,
        code: product.code,
        current_stock: product.stock_quantity,
        min_stock: product.min_stock,
        max_stock: product.max_stock,
        total_sold: totalSold,
        sales_count: salesCount,
        avg_daily_sales: avgDailySales,
        days_of_stock: daysOfStock,
        rotation_category: rotationCategory,
        needs_restock: product.stock_quantity <= product.min_stock,
        overstocked: product.max_stock && product.stock_quantity > product.max_stock
      }
    })
    
    res.json({
      success: true,
      data: {
        period_days: parseInt(days),
        analysis: rotationAnalysis
      }
    })
    
  } catch (error) {
    console.error('Error al obtener análisis de rotación:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

module.exports = router
