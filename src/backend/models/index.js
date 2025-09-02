const { DataTypes } = require('sequelize')

// Definir todos los modelos en el orden correcto
function defineModels(sequelize) {
  // 1. User Model (sin dependencias)
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'cajero', 'inventario', 'vendedor'),
      allowNull: false,
      defaultValue: 'cajero'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['username'] },
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['is_active'] }
    ]
  })

  // 2. Category Model
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: '#1976D2'
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'categories',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['parent_id'] },
      { fields: ['is_active'] }
    ]
  })

  // 3. Supplier Model
  const Supplier = sequelize.define('Supplier', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    business_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    identification: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true
    },
    identification_type: {
      type: DataTypes.ENUM('RIF', 'CI', 'PASSPORT', 'OTHER'),
      allowNull: false,
      defaultValue: 'RIF'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Venezuela'
    },
    postal_code: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    mobile: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    website: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    contact_person: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contact_phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    contact_email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    payment_terms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 30
    },
    credit_limit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0
    },
    current_balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    tax_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 16
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'suppliers',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['code'] },
      { fields: ['name'] },
      { fields: ['identification'] },
      { fields: ['is_active'] }
    ]
  })

  // 4. Product Model
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    barcode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    unit: {
      type: DataTypes.ENUM('unidad', 'kg', 'litros', 'metros', 'cajas', 'paquetes'),
      allowNull: false,
      defaultValue: 'unidad'
    },
    cost_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    cost_currency: {
      type: DataTypes.ENUM('VES', 'USD'),
      allowNull: false,
      defaultValue: 'VES'
    },
    profit_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 30
    },
    retail_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    wholesale_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    usd_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    tax_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 16
    },
    is_taxable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    stock_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    min_stock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    max_stock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'suppliers',
        key: 'id'
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'products',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['code'] },
      { fields: ['barcode'] },
      { fields: ['name'] },
      { fields: ['category_id'] },
      { fields: ['supplier_id'] },
      { fields: ['is_active'] }
    ]
  })

  // 5. Customer Model
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    business_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    identification: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true
    },
    identification_type: {
      type: DataTypes.ENUM('RIF', 'CI', 'PASSPORT', 'OTHER'),
      allowNull: false,
      defaultValue: 'CI'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Venezuela'
    },
    postal_code: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    mobile: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    category: {
      type: DataTypes.ENUM('normal', 'preferencial'),
      allowNull: false,
      defaultValue: 'normal'
    },
    credit_limit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0
    },
    current_balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    payment_terms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 30
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'customers',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['code'] },
      { fields: ['name'] },
      { fields: ['identification'] },
      { fields: ['category'] },
      { fields: ['is_active'] }
    ]
  })

  // 6. Sale Model
  const Sale = sequelize.define('Sale', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoice_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sale_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    payment_method: {
      type: DataTypes.ENUM('efectivo', 'transferencia', 'pos', 'pago_movil'),
      allowNull: false,
      defaultValue: 'efectivo'
    },
    payment_status: {
      type: DataTypes.ENUM('pendiente', 'pagado', 'parcial'),
      allowNull: false,
      defaultValue: 'pagado'
    },
    sale_type: {
      type: DataTypes.ENUM('detal', 'mayorista', 'mixta'),
      allowNull: false,
      defaultValue: 'detal'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'sales',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['invoice_number'] },
      { fields: ['customer_id'] },
      { fields: ['user_id'] },
      { fields: ['sale_date'] },
      { fields: ['payment_status'] },
      { fields: ['is_active'] }
    ]
  })

  // 7. SaleDetail Model
  const SaleDetail = sequelize.define('SaleDetail', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sale_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sales',
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    tax_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 16
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'sale_details',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['sale_id'] },
      { fields: ['product_id'] }
    ]
  })

  // Establecer asociaciones
  setupAssociations(User, Product, Category, Supplier, Customer, Sale, SaleDetail)

  return {
    User,
    Product,
    Category,
    Supplier,
    Customer,
    Sale,
    SaleDetail
  }
}

// Función para establecer asociaciones
function setupAssociations(User, Product, Category, Supplier, Customer, Sale, SaleDetail) {
  // Asociaciones de User
  User.hasMany(Product, { as: 'products', foreignKey: 'created_by' })
  User.hasMany(Product, { as: 'updatedProducts', foreignKey: 'updated_by' })
  User.hasMany(Sale, { as: 'sales', foreignKey: 'user_id' })
  User.hasMany(Customer, { as: 'customers', foreignKey: 'created_by' })
  User.hasMany(Customer, { as: 'updatedCustomers', foreignKey: 'updated_by' })
  User.hasMany(Category, { as: 'categories', foreignKey: 'created_by' })
  User.hasMany(Category, { as: 'updatedCategories', foreignKey: 'updated_by' })
  User.hasMany(Supplier, { as: 'suppliers', foreignKey: 'created_by' })
  User.hasMany(Supplier, { as: 'updatedSuppliers', foreignKey: 'updated_by' })

  // Asociaciones de Product
  Product.belongsTo(User, { as: 'creator', foreignKey: 'created_by' })
  Product.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' })
  Product.belongsTo(Category, { as: 'category', foreignKey: 'category_id' })
  Product.belongsTo(Supplier, { as: 'supplier', foreignKey: 'supplier_id' })
  Product.hasMany(SaleDetail, { as: 'saleDetails', foreignKey: 'product_id' })

  // Asociaciones de Category
  Category.belongsTo(User, { as: 'creator', foreignKey: 'created_by' })
  Category.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' })
  Category.hasMany(Product, { as: 'products', foreignKey: 'category_id' })
  Category.hasMany(Category, { as: 'subcategories', foreignKey: 'parent_id' })
  Category.belongsTo(Category, { as: 'parent', foreignKey: 'parent_id' })

  // Asociaciones de Supplier
  Supplier.belongsTo(User, { as: 'creator', foreignKey: 'created_by' })
  Supplier.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' })
  Supplier.hasMany(Product, { as: 'products', foreignKey: 'supplier_id' })

  // Asociaciones de Customer
  Customer.belongsTo(User, { as: 'creator', foreignKey: 'created_by' })
  Customer.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' })
  Customer.hasMany(Sale, { as: 'sales', foreignKey: 'customer_id' })

  // Asociaciones de Sale
  Sale.belongsTo(User, { as: 'user', foreignKey: 'user_id' })
  Sale.belongsTo(Customer, { as: 'customer', foreignKey: 'customer_id' })
  Sale.hasMany(SaleDetail, { as: 'details', foreignKey: 'sale_id' })

  // Asociaciones de SaleDetail
  SaleDetail.belongsTo(Sale, { as: 'sale', foreignKey: 'sale_id' })
  SaleDetail.belongsTo(Product, { as: 'product', foreignKey: 'product_id' })
}

module.exports = defineModels
