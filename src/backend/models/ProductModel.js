const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Código interno o de barras del producto',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nombre del producto',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción detallada del producto',
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Costo de compra del producto',
  },
  profitPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Porcentaje de ganancia sobre el costo',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Precio de venta final al público',
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Cantidad de unidades en inventario',
  },
  status: {
    type: DataTypes.ENUM('active', 'discontinued'),
    defaultValue: 'active',
    comment: 'Estado del producto'
  }
}, {
  tableName: 'products',
  timestamps: true,
  comment: 'Tabla para almacenar los productos del inventario',
  indexes: [
    {
      unique: true,
      fields: ['code']
    },
    {
      fields: ['name']
    }
  ]
});

module.exports = Product;
