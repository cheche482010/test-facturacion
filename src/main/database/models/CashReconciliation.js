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
    lote: {
      type: DataTypes.STRING(10),
      allowNull: true,
      unique: true,
    },
    openingDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    closingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    openingBalanceBs: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Saldo inicial en Bolívares',
    },
    openingBalanceUsd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Saldo inicial en Dólares',
    },
    closingBalanceBs: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Saldo final en Bolívares',
    },
    closingBalanceUsd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Saldo final en Dólares',
    },
    openingBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Campo legacy - usar openingBalanceBs y openingBalanceUsd',
    },
    closingBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Campo legacy - usar closingBalanceBs y closingBalanceUsd',
    },
    totalSales: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Total de ventas en BS (suma de total_bs de las ventas del día)',
    },
    totalSalesUsd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Total de ventas en USD (totalSales / tasa_dolar_del_día_de_cierre)',
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