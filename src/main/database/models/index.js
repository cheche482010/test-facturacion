const User = require("./User")
const Category = require("./Category")
const Product = require("./Product")
const Sale = require("./Sale")
const SaleItem = require("./SaleItem")
const InventoryMovement = require("./InventoryMovement")
const Settings = require("./Settings")

// Definir relaciones
// Product relationships
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" })
Category.hasMany(Product, { foreignKey: "categoryId", as: "products" })

// Sale relationships
Sale.belongsTo(User, { foreignKey: "userId", as: "user" })
User.hasMany(Sale, { foreignKey: "userId", as: "sales" })

// SaleItem relationships
Sale.hasMany(SaleItem, { foreignKey: "saleId", as: "items" })
SaleItem.belongsTo(Sale, { foreignKey: "saleId", as: "sale" })
SaleItem.belongsTo(Product, { foreignKey: "productId", as: "product" })
Product.hasMany(SaleItem, { foreignKey: "productId", as: "saleItems" })

// InventoryMovement relationships
InventoryMovement.belongsTo(Product, { foreignKey: "productId", as: "product" })
InventoryMovement.belongsTo(User, { foreignKey: "userId", as: "user" })
Product.hasMany(InventoryMovement, { foreignKey: "productId", as: "movements" })
User.hasMany(InventoryMovement, { foreignKey: "userId", as: "movements" })

module.exports = {
  User,
  Category,
  Product,
  Sale,
  SaleItem,
  InventoryMovement,
  Settings,
}
