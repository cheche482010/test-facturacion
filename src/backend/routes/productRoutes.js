const express = require('express');
const { models } = require('../config/database');
const { Op } = require('sequelize');

const router = express.Router();
const { Product } = models;

// --- Helper para mapear datos ---
// Mapea de snake_case (DB) a camelCase (API)
const toCamelCase = (product) => {
  if (!product) return null;
  // Usar .get({ plain: true }) para obtener un objeto JS plano de la instancia de Sequelize
  const plainProduct = product.get({ plain: true });
  return {
    id: plainProduct.id,
    code: plainProduct.code,
    name: plainProduct.name,
    description: plainProduct.description,
    cost: parseFloat(plainProduct.cost_price),
    profitPercentage: parseFloat(plainProduct.profit_percentage),
    price: parseFloat(plainProduct.retail_price),
    stock: plainProduct.stock_quantity,
    status: plainProduct.is_active ? 'active' : 'discontinued' // Mapear is_active a status
  };
};

// --- Rutas CRUD ---

// GET /api/products - Listar todos los productos
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
    res.json(products.map(toCamelCase));
  } catch (error) {
    console.error('Error al listar productos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/products/search - Buscar productos para autocomplete
router.get('/search', async (req, res) => {
  try {
    const { term } = req.query;
    if (!term || term.length < 2) {
      return res.json([]);
    }

    const products = await Product.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { name: { [Op.like]: `%${term}%` } },
          { code: { [Op.like]: `%${term}%` } }
        ]
      },
      limit: 10
    });

    res.json(products.map(toCamelCase));
  } catch (error) {
    console.error('Error al buscar productos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/products - Crear un nuevo producto
router.post('/', async (req, res) => {
  try {
    const { code, name, description, cost, profitPercentage, stock } = req.body;

    // Validación básica
    if (!code || !name || cost === undefined || profitPercentage === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Faltan campos requeridos: code, name, cost, profitPercentage, stock.' });
    }

    // Calcular precio de venta
    const calculatedPrice = parseFloat(cost) * (1 + parseFloat(profitPercentage) / 100);

    const newProduct = await Product.create({
      code,
      name,
      description,
      cost_price: cost,
      profit_percentage: profitPercentage,
      retail_price: calculatedPrice.toFixed(2),
      stock_quantity: stock,
      // El modelo en index.js es complejo, así que nos aseguramos de llenar los campos requeridos
      // con valores por defecto si no vienen en el request.
      unit: 'unidad', // Valor por defecto
      tax_rate: 16, // Valor por defecto
      is_taxable: true, // Valor por defecto
      created_by: 1 // Placeholder para el ID de usuario, se debe reemplazar con auth real
    });

    res.status(201).json(toCamelCase(newProduct));
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: `El código de producto '${req.body.code}' ya existe.` });
    }
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /api/products/:id - Actualizar un producto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const { code, name, description, cost, profitPercentage, stock } = req.body;
    
    const newCost = cost !== undefined ? parseFloat(cost) : product.cost_price;
    const newProfitPercentage = profitPercentage !== undefined ? parseFloat(profitPercentage) : product.profit_percentage;
    const calculatedPrice = newCost * (1 + newProfitPercentage / 100);

    const updatedProduct = await product.update({
      code: code || product.code,
      name: name || product.name,
      description: description === undefined ? product.description : description,
      cost_price: newCost,
      profit_percentage: newProfitPercentage,
      retail_price: calculatedPrice.toFixed(2),
      stock_quantity: stock !== undefined ? stock : product.stock_quantity,
      updated_by: 1 // Placeholder para el ID de usuario
    });

    res.json(toCamelCase(updatedProduct));
  } catch (error) {
     if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: `El código de producto '${req.body.code}' ya existe.` });
    }
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /api/products/:id - Eliminar un producto (hard delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    await product.destroy();
    res.status(204).send(); // No Content

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
