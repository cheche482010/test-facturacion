const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');

router.get('/exchange-rate', async (req, res) => {
  try {
    const rate = await currencyController.getExchangeRate();
    res.json(rate);
  } catch (error) {
    res.status(500).json({ message: 'Error getting exchange rate' });
  }
});

router.post('/exchange-rate/update', async (req, res) => {
  try {
    const newRate = await currencyController.updateExchangeRate();
    res.json(newRate);
  } catch (error) {
    res.status(500).json({ message: 'Error updating exchange rate' });
  }
});

module.exports = router;
