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
    unitPriceBs: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Precio unitario en Bs al momento de la venta'
    },
    subtotalBs: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Subtotal en Bs (quantity * unitPriceBs)'
    },
  },
  {
    tableName: "sale_items",
  },
)

module.exports = SaleItem
