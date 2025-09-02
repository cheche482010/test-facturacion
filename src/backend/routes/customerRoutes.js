const express = require('express')
const { Customer } = require('../models')
const { validateToken, checkPermission } = require('../middleware/auth')
const { Op } = require('sequelize')

const router = express.Router()

// Middleware para validar datos de cliente
const validateCustomerData = (req, res, next) => {
  const { name, identification, identification_type, type } = req.body
  
  if (!name || !identification || !identification_type || !type) {
    return res.status(400).json({
      success: false,
      message: 'Nombre, identificación, tipo de identificación y tipo de cliente son requeridos'
    })
  }
  
  const validIdentificationTypes = ['CI', 'RIF', 'PASAPORTE']
  if (!validIdentificationTypes.includes(identification_type)) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de identificación inválido'
    })
  }
  
  const validTypes = ['natural', 'juridico']
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de cliente inválido'
    })
  }
  
  // Validar email si se proporciona
  if (req.body.email && !req.body.email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Email inválido'
    })
  }
  
  // Validar límite de crédito
  if (req.body.credit_limit && req.body.credit_limit < 0) {
    return res.status(400).json({
      success: false,
      message: 'El límite de crédito no puede ser negativo'
    })
  }
  
  next()
}

// GET /api/customers - Listar clientes
router.get('/', validateToken, checkPermission('customers', 'read'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      type, 
      category, 
      is_active,
      has_balance 
    } = req.query
    
    const where = {}
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { business_name: { [Op.like]: `%${search}%` } },
        { identification: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } }
      ]
    }
    
    if (type) {
      where.type = type
    }
    
    if (category) {
      where.category = category
    }
    
    if (is_active !== undefined) {
      where.is_active = is_active === 'true'
    }
    
    if (has_balance === 'true') {
      where.current_balance = {
        [Op.gt]: 0
      }
    }
    
    const offset = (page - 1) * limit
    
    const { count, rows } = await Customer.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    })
    
    res.json({
      success: true,
      data: {
        customers: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    })
    
  } catch (error) {
    console.error('Error al listar clientes:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/customers/:id - Obtener cliente por ID
router.get('/:id', validateToken, checkPermission('customers', 'read'), async (req, res) => {
  try {
    const { id } = req.params
    
    const customer = await Customer.findByPk(id)
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      })
    }
    
    res.json({
      success: true,
      data: customer
    })
    
  } catch (error) {
    console.error('Error al obtener cliente:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/customers/search/:term - Buscar clientes por término
router.get('/search/:term', validateToken, checkPermission('customers', 'read'), async (req, res) => {
  try {
    const { term } = req.params
    
    const customers = await Customer.searchByName(term)
    
    res.json({
      success: true,
      data: customers
    })
    
  } catch (error) {
    console.error('Error al buscar clientes:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/customers - Crear cliente
router.post('/', validateToken, checkPermission('customers', 'create'), validateCustomerData, async (req, res) => {
  try {
    const customerData = {
      ...req.body,
      created_by: req.user.id
    }
    
    const customer = await Customer.create(customerData)
    
    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: customer
    })
    
  } catch (error) {
    console.error('Error al crear cliente:', error)
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'La identificación ya existe'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// PUT /api/customers/:id - Actualizar cliente
router.put('/:id', validateToken, checkPermission('customers', 'update'), validateCustomerData, async (req, res) => {
  try {
    const { id } = req.params
    
    const customer = await Customer.findByPk(id)
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      })
    }
    
    const updateData = {
      ...req.body,
      updated_by: req.user.id
    }
    
    await customer.update(updateData)
    
    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: customer
    })
    
  } catch (error) {
    console.error('Error al actualizar cliente:', error)
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'La identificación ya existe'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// DELETE /api/customers/:id - Desactivar cliente
router.delete('/:id', validateToken, checkPermission('customers', 'delete'), async (req, res) => {
  try {
    const { id } = req.params
    
    const customer = await Customer.findByPk(id)
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      })
    }
    
    // Verificar si el cliente tiene balance pendiente
    if (customer.current_balance > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede desactivar un cliente con balance pendiente'
      })
    }
    
    await customer.update({ 
      is_active: false,
      updated_by: req.user.id
    })
    
    res.json({
      success: true,
      message: 'Cliente desactivado exitosamente'
    })
    
  } catch (error) {
    console.error('Error al desactivar cliente:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/customers/overdue/list - Clientes con pagos vencidos
router.get('/overdue/list', validateToken, checkPermission('customers', 'read'), async (req, res) => {
  try {
    const customers = await Customer.getOverdue()
    
    res.json({
      success: true,
      data: customers
    })
    
  } catch (error) {
    console.error('Error al obtener clientes vencidos:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/customers/:id/payment - Registrar pago de cliente
router.post('/:id/payment', validateToken, checkPermission('customers', 'update'), async (req, res) => {
  try {
    const { id } = req.params
    const { amount, payment_method, notes = '' } = req.body
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Monto válido requerido'
      })
    }
    
    const customer = await Customer.findByPk(id)
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      })
    }
    
    if (customer.current_balance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El cliente no tiene balance pendiente'
      })
    }
    
    const paymentAmount = Math.min(amount, customer.current_balance)
    const oldBalance = customer.current_balance
    
    await customer.updateBalance(paymentAmount, 'subtract')
    
    // Aquí podrías registrar el pago en una tabla de historial de pagos
    
    res.json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: {
        customer_id: customer.id,
        payment_amount: paymentAmount,
        old_balance: oldBalance,
        new_balance: customer.current_balance,
        remaining_balance: customer.current_balance
      }
    })
    
  } catch (error) {
    console.error('Error al registrar pago:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/customers/:id/sales - Historial de ventas del cliente
router.get('/:id/sales', validateToken, checkPermission('customers', 'read'), async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 20 } = req.query
    
    const customer = await Customer.findByPk(id)
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      })
    }
    
    const offset = (page - 1) * limit
    
    const { count, rows } = await customer.getSales({
      where: { is_cancelled: false },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: require('../models').User,
          as: 'user',
          attributes: ['id', 'username', 'full_name']
        }
      ]
    })
    
    res.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          business_name: customer.business_name,
          current_balance: customer.current_balance,
          credit_limit: customer.credit_limit
        },
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
    console.error('Error al obtener historial de ventas:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET /api/customers/category/:category - Clientes por categoría
router.get('/category/:category', validateToken, checkPermission('customers', 'read'), async (req, res) => {
  try {
    const { category } = req.params
    
    const customers = await Customer.getByCategory(category)
    
    res.json({
      success: true,
      data: customers
    })
    
  } catch (error) {
    console.error('Error al obtener clientes por categoría:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

module.exports = router
