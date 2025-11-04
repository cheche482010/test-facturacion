const { DataTypes } = require("sequelize")
const { sequelize } = require("../connection")

const Sale = sequelize.define(
  "Sale",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    saleNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    // Montos
    subtotalUsd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    subtotalBs: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalUsd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalBs: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
    // Pago
    paymentStatus: {
      type: DataTypes.ENUM("pagado", "pendiente", "parcial"),
      defaultValue: "pagado",
    },
    paidAmountBs: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    paidAmountUsd: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    changeAmountBs: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    changeAmountUsd: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    // Estado
    status: {
      type: DataTypes.ENUM("completada", "cancelada", "anulada"),
      defaultValue: "completada",
    },
    notes: {
      type: DataTypes.TEXT,
    },
    sale_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "sales",
  },
)

module.exports = Sale
