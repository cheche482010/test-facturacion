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
    // Tipo de venta
    saleType: {
      type: DataTypes.ENUM("detal", "mayorista", "mixta"),
      defaultValue: "detal",
    },
    // Montos
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    // Pago
    paymentMethod: {
      type: DataTypes.ENUM("efectivo_bs", "efectivo_usd", "transferencia", "pos", "pago_movil", "credito"),
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM("pagado", "pendiente", "parcial"),
      defaultValue: "pagado",
    },
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    changeAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    // Documento
    documentType: {
      type: DataTypes.ENUM("factura", "ticket", "nota_debito", "nota_credito"),
      defaultValue: "ticket",
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
