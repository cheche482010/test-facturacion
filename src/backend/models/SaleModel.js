const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoice_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 50]
    }
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  sale_type: {
    type: DataTypes.ENUM('detal', 'mayorista', 'mixta'),
    allowNull: false,
    defaultValue: 'detal'
  },
  payment_method: {
    type: DataTypes.ENUM('efectivo_ves', 'efectivo_usd', 'transferencia', 'pos', 'pago_movil', 'credito'),
    allowNull: false,
    defaultValue: 'efectivo_ves'
  },
  payment_status: {
    type: DataTypes.ENUM('pagado', 'pendiente', 'parcial'),
    allowNull: false,
    defaultValue: 'pagado'
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  tax_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  discount_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  discount_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  paid_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  change_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  exchange_rate: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
    defaultValue: 1
  },
  currency: {
    type: DataTypes.ENUM('VES', 'USD'),
    allowNull: false,
    defaultValue: 'VES'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_cancelled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  cancelled_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelled_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  printed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  printed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'sales',
  timestamps: true,
  hooks: {
    beforeCreate: async (sale) => {
      // Generar número de factura automático si no se proporciona
      if (!sale.invoice_number) {
        sale.invoice_number = await Sale.generateInvoiceNumber()
      }
      
      // Calcular totales
      await sale.calculateTotals()
    },
    beforeUpdate: async (sale) => {
      // Recalcular totales si cambió algo
      if (sale.changed('subtotal') || sale.changed('tax_amount') || sale.changed('discount_amount')) {
        await sale.calculateTotals()
      }
    }
  }
})

// Métodos de instancia
Sale.prototype.calculateTotals = async function() {
  // Calcular descuento en monto si se proporciona porcentaje
  if (this.discount_percentage > 0 && this.discount_amount === 0) {
    this.discount_amount = parseFloat((this.subtotal * this.discount_percentage / 100).toFixed(2))
  }
  
  // Calcular total
  this.total = parseFloat((this.subtotal + this.tax_amount - this.discount_amount).toFixed(2))
  
  // Calcular cambio si se pagó más del total
  if (this.paid_amount > this.total) {
    this.change_amount = parseFloat((this.paid_amount - this.total).toFixed(2))
  } else {
    this.change_amount = 0
  }
  
  // Actualizar estado de pago
  if (this.paid_amount >= this.total) {
    this.payment_status = 'pagado'
  } else if (this.paid_amount > 0) {
    this.payment_status = 'parcial'
  } else {
    this.payment_status = 'pendiente'
  }
}

Sale.prototype.addPayment = async function(amount, method = null) {
  this.paid_amount += amount
  
  if (method) {
    this.payment_method = method
  }
  
  await this.calculateTotals()
  await this.save()
  
  return this.payment_status
}

Sale.prototype.cancel = async function(userId, reason = '') {
  this.is_cancelled = true
  this.cancelled_by = userId
  this.cancelled_at = new Date()
  this.cancelled_reason = reason
  
  await this.save()
}

Sale.prototype.markAsPrinted = async function() {
  this.printed = true
  this.printed_at = new Date()
  await this.save()
}

// Métodos estáticos
Sale.generateInvoiceNumber = async function() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  
  // Buscar el último número de factura del mes
  const lastSale = await this.findOne({
    where: {
      invoice_number: {
        [sequelize.Op.like]: `F${year}${month}%`
      }
    },
    order: [['invoice_number', 'DESC']]
  })
  
  let sequence = 1
  if (lastSale) {
    const lastSequence = parseInt(lastSale.invoice_number.slice(-4))
    sequence = lastSequence + 1
  }
  
  return `F${year}${month}${String(sequence).padStart(4, '0')}`
}

Sale.findByInvoiceNumber = function(invoiceNumber) {
  return this.findOne({ 
    where: { 
      invoice_number: invoiceNumber,
      is_cancelled: false
    } 
  })
}

Sale.getByDateRange = function(startDate, endDate) {
  return this.findAll({
    where: {
      created_at: {
        [sequelize.Op.between]: [startDate, endDate]
      },
      is_cancelled: false
    },
    order: [['created_at', 'DESC']]
  })
}

Sale.getByCustomer = function(customerId) {
  return this.findAll({
    where: {
      customer_id: customerId,
      is_cancelled: false
    },
    order: [['created_at', 'DESC']]
  })
}

Sale.getPendingPayments = function() {
  return this.findAll({
    where: {
      payment_status: {
        [sequelize.Op.in]: ['pendiente', 'parcial']
      },
      is_cancelled: false
    },
    order: [['due_date', 'ASC']]
  })
}

Sale.getTodaySales = function() {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
  
  return this.findAll({
    where: {
      created_at: {
        [sequelize.Op.between]: [startOfDay, endOfDay]
      },
      is_cancelled: false
    },
    order: [['created_at', 'DESC']]
  })
}

module.exports = Sale

