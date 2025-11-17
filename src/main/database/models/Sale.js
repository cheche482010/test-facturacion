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
    totalUsd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalBs: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    dolarRateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "dolar_rates",
        key: "id",
      },
    },
    paymentStatus: {
      type: DataTypes.ENUM("pagado", "pendiente", "parcial"),
      defaultValue: "pagado",
    },
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
