const { DataTypes } = require("sequelize")
const { sequelize } = require("../connection")

const Customer = sequelize.define(
  "Customer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customerCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    // Datos personales
    document_type: {
      type: DataTypes.ENUM("CI", "RIF", "PASSPORT"),
      allowNull: false,
    },
    document_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    customer_type: {
      type: DataTypes.ENUM("natural", "juridico"),
      allowNull: false,
      defaultValue: "natural",
    },
    first_name: {
      type: DataTypes.STRING(100),
    },
    last_name: {
      type: DataTypes.STRING(100),
    },
    company_name: {
      type: DataTypes.STRING(200),
    },
    // Contacto
    email: {
      type: DataTypes.STRING(100),
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
    },
    mobile: {
      type: DataTypes.STRING(20),
    },
    // Dirección
    address: {
      type: DataTypes.TEXT,
    },
    city: {
      type: DataTypes.STRING(100),
    },
    state: {
      type: DataTypes.STRING(100),
    },
    postal_code: {
      type: DataTypes.STRING(10),
    },
    // Configuración comercial
    category: {
      type: DataTypes.ENUM("normal", "preferencial", "mayorista"),
      defaultValue: "normal",
    },
    credit_limit: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    payment_terms: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // días
    },
    discount: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    // Estado
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "customers",
    indexes: [
      {
        unique: true,
        fields: ["document_type", "document_number"],
      },
      {
        fields: ["first_name"],
      },
      {
        fields: ["last_name"],
      },
      {
        fields: ["company_name"],
      },
    ],
  },
)

module.exports = Customer
