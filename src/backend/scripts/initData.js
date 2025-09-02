const bcrypt = require('bcryptjs')

// Función para crear datos iniciales
async function initializeData(models) {
  const { User, Category, Supplier } = models
  
  try {
    console.log('🌱 Inicializando datos básicos...')
    
    // Crear usuario administrador por defecto
    const adminExists = await User.findOne({ where: { username: 'admin' } })
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 12)
      await User.create({
        username: 'admin',
        email: 'admin@sistema.com',
        password: hashedPassword,
        full_name: 'Administrador del Sistema',
        role: 'admin',
        is_active: true,
        permissions: {
          products: ['create', 'read', 'update', 'delete'],
          inventory: ['create', 'read', 'update', 'delete'],
          sales: ['create', 'read', 'update', 'delete'],
          customers: ['create', 'read', 'update', 'delete'],
          reports: ['read'],
          config: ['read', 'update'],
          backup: ['create', 'read', 'restore']
        }
      })
      console.log('✅ Usuario administrador creado')
    }
    
    // Crear categorías básicas
    const defaultCategories = [
      { name: 'General', description: 'Categoría general de productos' },
      { name: 'Electrónicos', description: 'Productos electrónicos' },
      { name: 'Ropa', description: 'Vestimenta y accesorios' },
      { name: 'Alimentos', description: 'Productos alimenticios' },
      { name: 'Bebidas', description: 'Bebidas y líquidos' },
      { name: 'Limpieza', description: 'Productos de limpieza' },
      { name: 'Papelería', description: 'Artículos de oficina' }
    ]
    
    for (const catData of defaultCategories) {
      const exists = await Category.findOne({ where: { name: catData.name } })
      if (!exists) {
        await Category.create({
          ...catData,
          created_by: 1, // ID del usuario admin
          is_active: true
        })
      }
    }
    console.log('✅ Categorías básicas creadas')
    
    // Crear proveedor por defecto
    const defaultSupplier = await Supplier.findOne({ where: { code: 'PROV001' } })
    if (!defaultSupplier) {
      await Supplier.create({
        code: 'PROV001',
        name: 'Proveedor General',
        business_name: 'Proveedor General del Sistema',
        identification: 'J-00000000-0',
        identification_type: 'RIF',
        address: 'Dirección del proveedor',
        city: 'Ciudad',
        state: 'Estado',
        country: 'Venezuela',
        phone: '+58-000-000-0000',
        email: 'proveedor@sistema.com',
        contact_person: 'Contacto Principal',
        payment_terms: 30,
        credit_limit: 1000000,
        current_balance: 0,
        tax_rate: 16,
        is_active: true,
        created_by: 1
      })
      console.log('✅ Proveedor por defecto creado')
    }
    
    console.log('🎉 Datos iniciales creados exitosamente')
    
  } catch (error) {
    console.error('❌ Error al crear datos iniciales:', error)
    throw error
  }
}

module.exports = initializeData

