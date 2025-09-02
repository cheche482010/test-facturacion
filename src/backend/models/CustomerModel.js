const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 50]
    }
  },
  type: {
    type: DataTypes.ENUM('natural', 'juridico'),
    allowNull: false,
    defaultValue: 'natural'
  },
  identification: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      len: [5, 20]
    }
  },
  identification_type: {
    type: DataTypes.ENUM('CI', 'RIF', 'PASAPORTE'),
    allowNull: false,
    defaultValue: 'CI'
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [1, 200]
    }
  },
  business_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
    validate: {
      len: [1, 200]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  mobile: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  postal_code: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Venezuela'
  },
  category: {
    type: DataTypes.ENUM('normal', 'preferencial', 'vip'),
    allowNull: false,
    defaultValue: 'normal'
  },
  credit_limit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  current_balance: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  payment_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 365
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
  is_taxpayer: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  tax_exemption: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'customers',
  timestamps: true,
  hooks: {
    beforeCreate: async (customer) => {
      // Generar código automático si no se proporciona
      if (!customer.code) {
        customer.code = await Customer.generateCode()
      }
    }
  }
})

// Métodos de instancia
Customer.prototype.updateBalance = async function(amount, type = 'add') {
  if (type === 'add') {
    this.current_balance += amount
  } else if (type === 'subtract') {
    this.current_balance -= amount
  } else if (type === 'set') {
    this.current_balance = amount
  }
  
  await this.save()
  return this.current_balance
}

Customer.prototype.hasCreditAvailable = function(amount = 0) {
  return (this.credit_limit - this.current_balance) >= amount
}

Customer.prototype.getAvailableCredit = function() {
  return this.credit_limit - this.current_balance
}

Customer.prototype.isOverdue = function() {
  return this.current_balance > 0
}

// Métodos estáticos
Customer.generateCode = async function() {
  const lastCustomer = await this.findOne({
    order: [['id', 'DESC']]
  })
  
  const lastId = lastCustomer ? lastCustomer.id : 0
  return `CLI${String(lastId + 1).padStart(6, '0')}`
}

Customer.findByCode = function(code) {
  return this.findOne({ 
    where: { 
      code: code,
      is_active: true 
    } 
  })
}

Customer.findByIdentification = function(identification) {
  return this.findOne({ 
    where: { 
      identification: identification,
      is_active: true 
    } 
  })
}

Customer.searchByName = function(name) {
  return this.findAll({
    where: {
      [sequelize.Op.or]: [
        {
          name: {
            [sequelize.Op.like]: `%${name}%`
          }
        },
        {
          business_name: {
            [sequelize.Op.like]: `%${name}%`
          }
        }
      ],
      is_active: true
    },
    limit: 20
  })
}

Customer.getOverdue = function() {
  return this.findAll({
    where: {
      is_active: true,
      current_balance: {
        [sequelize.Op.gt]: 0
      }
    }
  })
}

Customer.getByCategory = function(category) {
  return this.findAll({
    where: {
      category: category,
      is_active: true
    }
  })
}

module.exports = Customer

