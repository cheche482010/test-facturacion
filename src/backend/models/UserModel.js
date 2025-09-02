const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')
const bcrypt = require('bcryptjs')

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'cajero', 'inventario', 'vendedor'),
    allowNull: false,
    defaultValue: 'cajero'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12)
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12)
      }
    }
  }
})

// Métodos de instancia
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get())
  delete values.password
  return values
}

// Métodos estáticos
User.findByUsername = function(username) {
  return this.findOne({ where: { username, is_active: true } })
}

User.findByEmail = function(email) {
  return this.findOne({ where: { email, is_active: true } })
}

// Definir permisos por rol
User.ROLE_PERMISSIONS = {
  admin: {
    users: ['create', 'read', 'update', 'delete'],
    products: ['create', 'read', 'update', 'delete'],
    inventory: ['create', 'read', 'update', 'delete'],
    customers: ['create', 'read', 'update', 'delete'],
    sales: ['create', 'read', 'update', 'delete'],
    reports: ['read'],
    config: ['read', 'update'],
    backup: ['create', 'read', 'restore']
  },
  cajero: {
    products: ['read'],
    inventory: ['read'],
    customers: ['read'],
    sales: ['create', 'read'],
    reports: ['read']
  },
  inventario: {
    products: ['create', 'read', 'update'],
    inventory: ['create', 'read', 'update'],
    reports: ['read']
  },
  vendedor: {
    products: ['read'],
    inventory: ['read'],
    customers: ['create', 'read', 'update'],
    sales: ['create', 'read'],
    reports: ['read']
  }
}

// Método para verificar permisos
User.prototype.hasPermission = function(resource, action) {
  const permissions = User.ROLE_PERMISSIONS[this.role] || {}
  return permissions[resource]?.includes(action) || false
}

module.exports = User

