const { DataTypes } = require("sequelize")
const { sequelize } = require("../connection")

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    internalCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    barcode: {
      type: DataTypes.STRING(100),
      unique: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: "categories",
        key: "id",
      },
    },
    // Costos y precios
    costPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    costCurrency: {
      type: DataTypes.ENUM("VES", "USD"),
      defaultValue: "VES",
    },
    profitPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 30.0,
    },
    retailPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    dollarPrice: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    // Inventario
    currentStock: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    // Estado
    status: {
      type: DataTypes.ENUM("activo", "descontinuado", "agotado"),
      defaultValue: "activo",
    },
    // Metadatos
    image: {
      type: DataTypes.STRING(500),
    },
  },
  {
    tableName: "products",
    hooks: {
      beforeSave: (product) => {
        // Calcular precio automático si no se especifica
        if (!product.retailPrice || product.retailPrice === 0) {
          const costPrice = parseFloat(product.costPrice) || 0
          const profitPercentage = parseFloat(product.profitPercentage) || 30
          const profit = costPrice * (profitPercentage / 100)
          product.retailPrice = costPrice + profit
        }
  
      },
    },
  },
)

module.exports = Product
