const User = require("./User")
const Category = require("./Category")
const Product = require("./Product")
const Sale = require("./Sale")
const SaleItem = require("./SaleItem")
const SalePayment = require("./SalePayment")
const PaymentMethod = require("./PaymentMethod")
const InventoryMovement = require("./InventoryMovement")
const Settings = require("./Settings")
const CashReconciliation = require("./CashReconciliation")
const DolarRate = require("./DolarRate")

Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" })
Category.hasMany(Product, { foreignKey: "categoryId", as: "products" })
Sale.belongsTo(User, { foreignKey: "userId", as: "user" })
User.hasMany(Sale, { foreignKey: "userId", as: "sales" })
Sale.belongsTo(DolarRate, { foreignKey: "dolarRateId", as: "dolarRate" })
DolarRate.hasMany(Sale, { foreignKey: "dolarRateId", as: "sales" })
Sale.hasMany(SaleItem, { foreignKey: "saleId", as: "items" })
SaleItem.belongsTo(Sale, { foreignKey: "saleId", as: "sale" })
SaleItem.belongsTo(Product, { foreignKey: "productId", as: "product" })
Product.hasMany(SaleItem, { foreignKey: "productId", as: "saleItems" })
Sale.hasMany(SalePayment, { foreignKey: "saleId", as: "payments" })
SalePayment.belongsTo(Sale, { foreignKey: "saleId", as: "sale" })
SalePayment.belongsTo(PaymentMethod, { foreignKey: "paymentMethodId", as: "paymentMethod" })
PaymentMethod.hasMany(SalePayment, { foreignKey: "paymentMethodId", as: "salePayments" })
InventoryMovement.belongsTo(Product, { foreignKey: "productId", as: "product" })
InventoryMovement.belongsTo(User, { foreignKey: "userId", as: "user" })
Product.hasMany(InventoryMovement, { foreignKey: "productId", as: "movements" })
User.hasMany(InventoryMovement, { foreignKey: "userId", as: "movements" })
CashReconciliation.belongsTo(User, { foreignKey: "userId", as: "user" })
User.hasMany(CashReconciliation, { foreignKey: "userId", as: "cashReconciliations" })

module.exports = {
  User,
  Category,
  Product,
  Sale,
  SaleItem,
  SalePayment,
  PaymentMethod,
  InventoryMovement,
  Settings,
  CashReconciliation,
  DolarRate,
}
