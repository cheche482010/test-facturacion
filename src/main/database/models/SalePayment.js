const { DataTypes } = require("sequelize")
const { sequelize } = require("../connection")

const SalePayment = sequelize.define(
  "SalePayment",
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
    paymentMethodId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "payment_methods",
        key: "id",
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "sale_payments",
  },
)

module.exports = SalePayment