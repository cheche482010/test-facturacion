const express = require('express')
const { Product } = require('../models')
const { validateToken, checkPermission } = require('../middleware/auth')
const { Op } = require('sequelize')

const router = express.Router()

// Middleware para validar datos de producto
const validateProductData = (req, res, next) => {
  const { name, cost_price, unit } = req.body
  
  if (!name || !cost_price || !unit) {
    return res.status(400).json({
      success: false,
      message: 'Nombre, precio de costo y unidad son requeridos'
    })
  }
  
  if (cost_price < 0) {
    return res.status(400).json({
      success: false,
      message: 'El precio de costo no puede ser negativo'
    })
  }
  
  const validUnits = ['unidad', 'kg', 'litros', 'metros', 'cajas', 'paquetes']
  if (!validUnits.includes(unit)) {
    return res.status(400).json({
      success: false,
      message: 'Unidad de medida inválida'
    })
  }
  
  next()
}

// GET /api/products - Listar productos
router.get('/', validateToken, checkPermission('products', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category_id, is_active } = req.query
    
    const where = {}
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { barcode: { [Op.like]: `%${search}%` } }
      ]
    }
    
    if (category_id) {
      where.category_id = category_id
    }
    
    if (is_active !== undefined) {
      where.is_active = is_active === 'true'
    }
    
    const offset = (page - 1) * limit
    
    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    })
    
    res.json({
      success: true,
      data: {
        products: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    })
    
  } catch (error) {
    console.error('Error al listar productos:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/products/:id - Obtener producto por ID
router.get('/:id', validateToken, checkPermission('products', 'read'), async (req, res) => {
  try {
    const { id } = req.params
    
    const product = await Product.findByPk(id)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      })
    }
    
    res.json({
      success: true,
      data: product
    })
    
  } catch (error) {
    console.error('Error al obtener producto:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/products/search/:term - Buscar productos por término
router.get('/search/:term', validateToken, checkPermission('products', 'read'), async (req, res) => {
  try {
    const { term } = req.params
    
    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${term}%` } },
          { code: { [Op.like]: `%${term}%` } },
          { barcode: { [Op.like]: `%${term}%` } }
        ],
        is_active: true
      },
      limit: 20,
      order: [['name', 'ASC']]
    })
    
    res.json({
      success: true,
      data: products
    })
    
  } catch (error) {
    console.error('Error al buscar productos:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/products/barcode/:barcode - Buscar producto por código de barras
router.get('/barcode/:barcode', validateToken, checkPermission('products', 'read'), async (req, res) => {
  try {
    const { barcode } = req.params
    
    const product = await Product.findByBarcode(barcode)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      })
    }
    
    res.json({
      success: true,
      data: product
    })
    
  } catch (error) {
    console.error('Error al buscar producto por código de barras:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/products - Crear producto
router.post('/', validateToken, checkPermission('products', 'create'), validateProductData, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      created_by: req.user.id
    }
    
    const product = await Product.create(productData)
    
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: product
    })
    
  } catch (error) {
    console.error('Error al crear producto:', error)
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'El código o código de barras ya existe'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// PUT /api/products/:id - Actualizar producto
router.put('/:id', validateToken, checkPermission('products', 'update'), validateProductData, async (req, res) => {
  try {
    const { id } = req.params
    
    const product = await Product.findByPk(id)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      })
    }
    
    const updateData = {
      ...req.body,
      updated_by: req.user.id
    }
    
    await product.update(updateData)
    
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: product
    })
    
  } catch (error) {
    console.error('Error al actualizar producto:', error)
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'El código o código de barras ya existe'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// DELETE /api/products/:id - Desactivar producto
router.delete('/:id', validateToken, checkPermission('products', 'delete'), async (req, res) => {
  try {
    const { id } = req.params
    
    const product = await Product.findByPk(id)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      })
    }
    
    // Verificar si el producto tiene stock
    if (product.stock_quantity > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede desactivar un producto con stock disponible'
      })
    }
    
    await product.update({ 
      is_active: false,
      updated_by: req.user.id
    })
    
    res.json({
      success: true,
      message: 'Producto desactivado exitosamente'
    })
    
  } catch (error) {
    console.error('Error al desactivar producto:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/products/:id/stock - Actualizar stock de producto
router.post('/:id/stock', validateToken, checkPermission('inventory', 'update'), async (req, res) => {
  try {
    const { id } = req.params
    const { quantity, type = 'set', reason = '' } = req.body
    
    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Cantidad válida requerida'
      })
    }
    
    const product = await Product.findByPk(id)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      })
    }
    
    const oldStock = product.stock_quantity
    await product.updateStock(quantity, type)
    
    // Aquí podrías registrar el movimiento en una tabla de historial
    
    res.json({
      success: true,
      message: 'Stock actualizado exitosamente',
      data: {
        product_id: product.id,
        old_stock: oldStock,
        new_stock: product.stock_quantity,
        change: product.stock_quantity - oldStock
      }
    })
    
  } catch (error) {
    console.error('Error al actualizar stock:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/products/low-stock/list - Listar productos con stock bajo
router.get('/low-stock/list', validateToken, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const products = await Product.getLowStock()
    
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

// POST /api/products/bulk-update - Actualización masiva de productos
router.post('/bulk-update', validateToken, checkPermission('products', 'update'), async (req, res) => {
  try {
    const { products } = req.body
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de productos requerida'
      })
    }
    
    const results = []
    
    for (const productData of products) {
      try {
        const product = await Product.findByPk(productData.id)
        
        if (product) {
          await product.update({
            ...productData,
            updated_by: req.user.id
          })
          results.push({ id: product.id, success: true })
        } else {
          results.push({ id: productData.id, success: false, error: 'Producto no encontrado' })
        }
      } catch (error) {
        results.push({ id: productData.id, success: false, error: error.message })
      }
    }
    
    res.json({
      success: true,
      message: 'Actualización masiva completada',
      data: results
    })
    
  } catch (error) {
    console.error('Error en actualización masiva:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

module.exports = router
