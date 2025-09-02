const express = require('express')
const { Sale, SaleDetail, Product, Customer, User } = require('../models')
const { validateToken, checkPermission } = require('../middleware/auth')
const { Op } = require('sequelize')

const router = express.Router()

// Middleware para validar datos de venta
const validateSaleData = (req, res, next) => {
  const { details, payment_method, sale_type } = req.body
  
  if (!details || !Array.isArray(details) || details.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Se requieren detalles de productos'
    })
  }
  
  const validPaymentMethods = ['efectivo_ves', 'efectivo_usd', 'transferencia', 'pos', 'pago_movil', 'credito']
  if (!validPaymentMethods.includes(payment_method)) {
    return res.status(400).json({
      success: false,
      message: 'Método de pago inválido'
    })
  }
  
  const validSaleTypes = ['detal', 'mayorista', 'mixta']
  if (!validSaleTypes.includes(sale_type)) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de venta inválido'
    })
  }
  
  // Validar cada detalle
  for (const detail of details) {
    if (!detail.product_id || !detail.quantity || !detail.unit_price) {
      return res.status(400).json({
        success: false,
        message: 'Cada detalle debe tener product_id, quantity y unit_price'
      })
    }
    
    if (detail.quantity <= 0 || detail.unit_price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cantidad y precio unitario deben ser mayores a 0'
      })
    }
  }
  
  next()
}

// GET /api/sales - Listar ventas
router.get('/', validateToken, checkPermission('sales', 'read'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      start_date, 
      end_date, 
      customer_id, 
      payment_status,
      sale_type 
    } = req.query
    
    const where = {}
    
    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      }
    }
    
    if (customer_id) {
      where.customer_id = customer_id
    }
    
    if (payment_status) {
      where.payment_status = payment_status
    }
    
    if (sale_type) {
      where.sale_type = sale_type
    }
    
    const offset = (page - 1) * limit
    
    const { count, rows } = await Sale.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'business_name', 'identification']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'full_name']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    })
    
    res.json({
      success: true,
      data: {
        sales: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    })
    
  } catch (error) {
    console.error('Error al listar ventas:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/sales/:id - Obtener venta por ID
router.get('/:id', validateToken, checkPermission('sales', 'read'), async (req, res) => {
  try {
    const { id } = req.params
    
    const sale = await Sale.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'business_name', 'identification', 'phone', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'full_name']
        },
        {
          model: SaleDetail,
          as: 'details',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'code', 'name', 'barcode', 'unit']
            }
          ]
        }
      ]
    })
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      })
    }
    
    res.json({
      success: true,
      data: sale
    })
    
  } catch (error) {
    console.error('Error al obtener venta:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/sales/invoice/:invoice_number - Obtener venta por número de factura
router.get('/invoice/:invoice_number', validateToken, checkPermission('sales', 'read'), async (req, res) => {
  try {
    const { invoice_number } = req.params
    
    const sale = await Sale.findByInvoiceNumber(invoice_number)
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      })
    }
    
    res.json({
      success: true,
      data: sale
    })
    
  } catch (error) {
    console.error('Error al buscar factura:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/sales - Crear nueva venta
router.post('/', validateToken, checkPermission('sales', 'create'), validateSaleData, async (req, res) => {
  const transaction = await Sale.sequelize.transaction()
  
  try {
    const { 
      customer_id, 
      details, 
      payment_method, 
      sale_type, 
      paid_amount = 0,
      discount_percentage = 0,
      notes = '',
      exchange_rate = 1,
      currency = 'VES'
    } = req.body
    
    // Verificar stock disponible
    for (const detail of details) {
      const product = await Product.findByPk(detail.product_id)
      
      if (!product) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: `Producto con ID ${detail.product_id} no encontrado`
        })
      }
      
      if (product.stock_quantity < detail.quantity) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock_quantity}`
        })
      }
    }
    
    // Crear la venta
    const saleData = {
      customer_id,
      user_id: req.user.id,
      payment_method,
      sale_type,
      paid_amount,
      discount_percentage,
      notes,
      exchange_rate,
      currency,
      due_date: payment_method === 'credito' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
    }
    
    const sale = await Sale.create(saleData, { transaction })
    
    // Crear detalles y actualizar stock
    let subtotal = 0
    let taxAmount = 0
    
    for (const detailData of details) {
      const product = await Product.findByPk(detailData.product_id)
      
      // Calcular precios según tipo de venta
      let unitPrice = product.retail_price
      if (sale_type === 'mayorista' && product.wholesale_price) {
        unitPrice = product.wholesale_price
      }
      
      const detail = await SaleDetail.create({
        sale_id: sale.id,
        product_id: product.id,
        quantity: detailData.quantity,
        unit_price: unitPrice,
        discount_percentage: detailData.discount_percentage || 0,
        tax_rate: product.tax_rate,
        cost_price: product.cost_price,
        notes: detailData.notes
      }, { transaction })
      
      // Actualizar stock
      await product.updateStock(detailData.quantity, 'subtract')
      
      subtotal += detail.subtotal
      taxAmount += detail.tax_amount
    }
    
    // Actualizar totales de la venta
    sale.subtotal = subtotal
    sale.tax_amount = taxAmount
    sale.discount_amount = subtotal * (discount_percentage / 100)
    await sale.calculateTotals()
    await sale.save({ transaction })
    
    // Si es venta a crédito, actualizar balance del cliente
    if (customer_id && payment_method === 'credito') {
      const customer = await Customer.findByPk(customer_id)
      if (customer) {
        await customer.updateBalance(sale.total, 'add')
      }
    }
    
    await transaction.commit()
    
    // Obtener la venta completa con detalles
    const completeSale = await Sale.findByPk(sale.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'business_name', 'identification']
        },
        {
          model: SaleDetail,
          as: 'details',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'code', 'name', 'barcode', 'unit']
            }
          ]
        }
      ]
    })
    
    res.status(201).json({
      success: true,
      message: 'Venta creada exitosamente',
      data: completeSale
    })
    
  } catch (error) {
    await transaction.rollback()
    console.error('Error al crear venta:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/sales/:id/payment - Agregar pago a venta
router.post('/:id/payment', validateToken, checkPermission('sales', 'update'), async (req, res) => {
  try {
    const { id } = req.params
    const { amount, method } = req.body
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Monto válido requerido'
      })
    }
    
    const sale = await Sale.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer'
        }
      ]
    })
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      })
    }
    
    if (sale.is_cancelled) {
      return res.status(400).json({
        success: false,
        message: 'No se puede agregar pago a una venta cancelada'
      })
    }
    
    // Agregar pago
    const oldPaidAmount = sale.paid_amount
    await sale.addPayment(amount, method)
    
    // Si se completó el pago y es venta a crédito, actualizar balance del cliente
    if (sale.payment_status === 'pagado' && sale.customer && oldPaidAmount < sale.total) {
      const paymentAmount = Math.min(amount, sale.total - oldPaidAmount)
      await sale.customer.updateBalance(paymentAmount, 'subtract')
    }
    
    res.json({
      success: true,
      message: 'Pago agregado exitosamente',
      data: {
        sale_id: sale.id,
        payment_status: sale.payment_status,
        paid_amount: sale.paid_amount,
        remaining: sale.total - sale.paid_amount
      }
    })
    
  } catch (error) {
    console.error('Error al agregar pago:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/sales/:id/cancel - Cancelar venta
router.post('/:id/cancel', validateToken, checkPermission('sales', 'update'), async (req, res) => {
  const transaction = await Sale.sequelize.transaction()
  
  try {
    const { id } = req.params
    const { reason = '' } = req.body
    
    const sale = await Sale.findByPk(id, {
      include: [
        {
          model: SaleDetail,
          as: 'details',
          include: [
            {
              model: Product,
              as: 'product'
            }
          ]
        },
        {
          model: Customer,
          as: 'customer'
        }
      ],
      transaction
    })
    
    if (!sale) {
      await transaction.rollback()
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      })
    }
    
    if (sale.is_cancelled) {
      await transaction.rollback()
      return res.status(400).json({
        success: false,
        message: 'La venta ya está cancelada'
      })
    }
    
    // Restaurar stock
    for (const detail of sale.details) {
      await detail.product.updateStock(detail.quantity, 'add')
    }
    
    // Si es venta a crédito, ajustar balance del cliente
    if (sale.customer && sale.payment_method === 'credito') {
      const unpaidAmount = sale.total - sale.paid_amount
      if (unpaidAmount > 0) {
        await sale.customer.updateBalance(unpaidAmount, 'subtract')
      }
    }
    
    // Cancelar la venta
    await sale.cancel(req.user.id, reason)
    
    await transaction.commit()
    
    res.json({
      success: true,
      message: 'Venta cancelada exitosamente'
    })
    
  } catch (error) {
    await transaction.rollback()
    console.error('Error al cancelar venta:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/sales/today/list - Ventas del día
router.get('/today/list', validateToken, checkPermission('sales', 'read'), async (req, res) => {
  try {
    const sales = await Sale.getTodaySales()
    
    res.json({
      success: true,
      data: sales
    })
    
  } catch (error) {
    console.error('Error al obtener ventas del día:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/sales/pending/list - Ventas pendientes de pago
router.get('/pending/list', validateToken, checkPermission('sales', 'read'), async (req, res) => {
  try {
    const sales = await Sale.getPendingPayments()
    
    res.json({
      success: true,
      data: sales
    })
    
  } catch (error) {
    console.error('Error al obtener ventas pendientes:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

module.exports = router
