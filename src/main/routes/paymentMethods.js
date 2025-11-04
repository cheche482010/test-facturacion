const express = require("express")
const { authenticateToken } = require("../middleware/auth")
const { PaymentMethod } = require("../database/models")

const router = express.Router()

router.use(authenticateToken)

router.get("/", async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.findAll({
      where: { isActive: true },
      order: [["name", "ASC"]]
    })
    res.json(paymentMethods)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router