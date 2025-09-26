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
    brand: {
      type: DataTypes.STRING(100),
    },
    unit: {
      type: DataTypes.ENUM("unidad", "kg", "litros", "metros", "cajas"),
      defaultValue: "unidad",
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
    wholesalePrice: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    dollarPrice: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    // Impuestos
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 16.0, // IVA 16%
    },
    // Inventario
    currentStock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    minStock: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },
    maxStock: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
    },
    location: {
      type: DataTypes.STRING(100),
    },
    // Estado
    status: {
      type: DataTypes.ENUM("activo", "descontinuado", "agotado"),
      defaultValue: "activo",
    },
    expirationDate: {
      type: DataTypes.DATE,
    },
    // Metadatos
    image: {
      type: DataTypes.STRING(255),
    },
  },
  {
    tableName: "products",
    hooks: {
      beforeSave: (product) => {
        // Calcular precio automático si no se especifica
        if (!product.retailPrice || product.retailPrice === 0) {
          const profit = product.costPrice * (product.profitPercentage / 100)
          product.retailPrice = product.costPrice + profit
        }

        // Calcular precio mayorista (10% menos que retail)
        if (!product.wholesalePrice || product.wholesalePrice === 0) {
          product.wholesalePrice = product.retailPrice * 0.9
        }
      },
    },
  },
)

module.exports = Product
