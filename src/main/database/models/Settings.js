const { DataTypes } = require("sequelize")
const { sequelize } = require("../connection")

const Settings = sequelize.define(
  "Settings",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT,
    },
    dataType: {
      type: DataTypes.ENUM("string", "number", "boolean", "json"),
      defaultValue: "string",
    },
    category: {
      type: DataTypes.STRING(50),
      defaultValue: "general",
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "settings",
  },
)

module.exports = Settings
