const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const SaleDetail = sequelize.define('SaleDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sale_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sales',
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 0.01
    }
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
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
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  tax_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 16,
    validate: {
      min: 0,
      max: 100
    }
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
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
  cost_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  profit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'sale_details',
  timestamps: true,
  hooks: {
    beforeCreate: async (detail) => {
      await detail.calculateTotals()
    },
    beforeUpdate: async (detail) => {
      if (detail.changed('quantity') || detail.changed('unit_price') || detail.changed('discount_percentage')) {
        await detail.calculateTotals()
      }
    }
  }
})

// Métodos de instancia
SaleDetail.prototype.calculateTotals = async function() {
  // Calcular subtotal
  this.subtotal = parseFloat((this.quantity * this.unit_price).toFixed(2))
  
  // Calcular descuento en monto si se proporciona porcentaje
  if (this.discount_percentage > 0) {
    this.discount_amount = parseFloat((this.subtotal * this.discount_percentage / 100).toFixed(2))
  }
  
  // Calcular impuesto
  const taxableAmount = this.subtotal - this.discount_amount
  this.tax_amount = parseFloat((taxableAmount * this.tax_rate / 100).toFixed(2))
  
  // Calcular total
  this.total = parseFloat((taxableAmount + this.tax_amount).toFixed(2))
  
  // Calcular ganancia
  const totalCost = this.quantity * this.cost_price
  this.profit = parseFloat((this.total - totalCost).toFixed(2))
}

SaleDetail.prototype.getProfitMargin = function() {
  if (this.total > 0) {
    return parseFloat(((this.profit / this.total) * 100).toFixed(2))
  }
  return 0
}

// Métodos estáticos
SaleDetail.getBySale = function(saleId) {
  return this.findAll({
    where: { sale_id: saleId },
    include: [
      {
        model: sequelize.models.Product,
        as: 'product',
        attributes: ['id', 'code', 'name', 'barcode', 'unit']
      }
    ],
    order: [['id', 'ASC']]
  })
}

SaleDetail.getByProduct = function(productId, startDate = null, endDate = null) {
  const where = { product_id: productId }
  
  if (startDate && endDate) {
    where.created_at = {
      [sequelize.Op.between]: [startDate, endDate]
    }
  }
  
  return this.findAll({
    where: where,
    include: [
      {
        model: sequelize.models.Sale,
        as: 'sale',
        attributes: ['id', 'invoice_number', 'created_at', 'customer_id'],
        where: { is_cancelled: false }
      }
    ],
    order: [['created_at', 'DESC']]
  })
}

SaleDetail.getTopProducts = function(limit = 10, startDate = null, endDate = null) {
  const where = {}
  
  if (startDate && endDate) {
    where.created_at = {
      [sequelize.Op.between]: [startDate, endDate]
    }
  }
  
  return this.findAll({
    where: where,
    attributes: [
      'product_id',
      [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
      [sequelize.fn('SUM', sequelize.col('total')), 'total_sales'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_sales_count']
    ],
    include: [
      {
        model: sequelize.models.Product,
        as: 'product',
        attributes: ['id', 'code', 'name']
      },
      {
        model: sequelize.models.Sale,
        as: 'sale',
        attributes: [],
        where: { is_cancelled: false }
      }
    ],
    group: ['product_id'],
    order: [[sequelize.fn('SUM', sequelize.col('total')), 'DESC']],
    limit: limit
  })
}

SaleDetail.getProfitReport = function(startDate = null, endDate = null) {
  const where = {}
  
  if (startDate && endDate) {
    where.created_at = {
      [sequelize.Op.between]: [startDate, endDate]
    }
  }
  
  return this.findAll({
    where: where,
    attributes: [
      [sequelize.fn('SUM', sequelize.col('subtotal')), 'total_subtotal'],
      [sequelize.fn('SUM', sequelize.col('discount_amount')), 'total_discounts'],
      [sequelize.fn('SUM', sequelize.col('tax_amount')), 'total_taxes'],
      [sequelize.fn('SUM', sequelize.col('total')), 'total_sales'],
      [sequelize.fn('SUM', sequelize.col('profit')), 'total_profit']
    ],
    include: [
      {
        model: sequelize.models.Sale,
        as: 'sale',
        attributes: [],
        where: { is_cancelled: false }
      }
    ]
  })
}

module.exports = SaleDetail

