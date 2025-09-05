const express = require('express');
const { sequelize, models } = require('../config/database');
const { Op } = require('sequelize');

const router = express.Router();
const { Product, Sale, SaleDetail } = models;

// POST /api/sales - Crear una nueva venta (Modo Bodega)
router.post('/', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { items, summary, paymentMethod } = req.body;

    // 1. Validación de datos
    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Se requieren productos para realizar la venta.' });
    }

    const productIds = items.map(item => item.productId);
    const products = await Product.findAll({
      where: { id: { [Op.in]: productIds } },
      transaction,
      lock: true // Bloquear filas para evitar race conditions de stock
    });
    
    const productMap = new Map(products.map(p => [p.id, p]));

    // 2. Verificar stock disponible
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        await transaction.rollback();
        return res.status(400).json({ message: `Producto con ID ${item.productId} no encontrado.` });
      }
      if (product.stock_quantity < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({ message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock_quantity}, solicitado: ${item.quantity}.` });
      }
    }

    // 3. Crear el registro de Venta (Sale)
    const sale = await Sale.create({
      invoice_number: `INV-${Date.now()}`, // Generar un número de factura simple
      user_id: 1, // Placeholder, reemplazar con usuario autenticado
      customer_id: null, // Nulo para Modo Bodega
      subtotal: summary.subtotal,
      tax_amount: summary.tax,
      discount_amount: 0, // Sin descuento en modo bodega por ahora
      total: summary.total,
      payment_method: paymentMethod,
      payment_status: 'pagado',
      sale_type: 'detal',
      is_active: true,
    }, { transaction });

    // 4. Crear los detalles de la venta y actualizar stock
    for (const item of items) {
      // Crear detalle de venta
      await SaleDetail.create({
        sale_id: sale.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        // El modelo de la BD tiene más campos, usamos defaults
        discount_percentage: 0,
        discount_amount: 0,
        tax_rate: 16.00, // Asumir 16%
        tax_amount: item.subtotal * 0.16,
        total: item.subtotal * 1.16
      }, { transaction });

      // Actualizar stock del producto
      const product = productMap.get(item.productId);
      await product.decrement('stock_quantity', { by: item.quantity, transaction });
    }

    // 5. Confirmar la transacción
    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Venta creada exitosamente',
      data: { saleId: sale.id }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear venta:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
