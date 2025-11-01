const { DataTypes } = require("sequelize")
const { sequelize } = require("../connection")

const DolarRate = sequelize.define(
  "DolarRate",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      unique: true,
    },
    source: {
      type: DataTypes.STRING(50),
      defaultValue: "oficial",
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "dolar_rates",
    timestamps: false,
  },
)

module.exports = DolarRate