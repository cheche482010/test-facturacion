const { DataTypes } = require("sequelize")
const { sequelize } = require("../connection")

const InventoryMovement = sequelize.define(
  "InventoryMovement",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    movementType: {
      type: DataTypes.ENUM("entrada", "salida", "ajuste", "devolucion"),
      allowNull: false,
    },
    reason: {
      type: DataTypes.ENUM(
        "compra",
        "venta",
        "ajuste_inventario",
        "devolucion_cliente",
        "devolucion_proveedor",
        "merma",
        "robo",
      ),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
    },
    previousStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    newStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    totalCost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    referenceId: {
      type: DataTypes.INTEGER, // ID de venta, compra, etc.
    },
    referenceType: {
      type: DataTypes.STRING(50), // 'sale', 'purchase', 'adjustment'
    },
    notes: {
      type: DataTypes.TEXT,
    },
    movementDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "inventory_movements",
  },
)

module.exports = InventoryMovement
