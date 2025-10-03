const { DataTypes } = require("sequelize")
const { sequelize } = require("../connection")

const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    parentId: {
      type: DataTypes.INTEGER,
      references: {
        model: "categories",
        key: "id",
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "categories",
  },
)

// Relación jerárquica
Category.belongsTo(Category, { as: "parent", foreignKey: "parentId" })
Category.hasMany(Category, { as: "children", foreignKey: "parentId" })

module.exports = Category
