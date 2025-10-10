const { DataTypes } = require("sequelize")
const { sequelize } = require("../connection")

const CashReconciliation = sequelize.define(
  "CashReconciliation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    openingDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    closingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    openingBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    closingBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    totalSales: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    totalExpenses: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "cash_reconciliations",
    timestamps: true,
  },
)

module.exports = CashReconciliation