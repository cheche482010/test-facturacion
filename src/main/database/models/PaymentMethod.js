const { DataTypes } = require("sequelize")
const { sequelize } = require("../connection")

const PaymentMethod = sequelize.define(
  "PaymentMethod",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "payment_methods",
  },
)

module.exports = PaymentMethod