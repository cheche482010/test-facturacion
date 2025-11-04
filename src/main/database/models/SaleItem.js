const { DataTypes } = require("sequelize")
const { sequelize } = require("../connection")

const SaleItem = sequelize.define(
  "SaleItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    saleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "sales",
        key: "id",
      },
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
    },
    quantity: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
    },
    unitPriceUsd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    unitPriceBs: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    subtotalUsd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    subtotalBs: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalUsd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalBs: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "sale_items",
  },
)

module.exports = SaleItem
