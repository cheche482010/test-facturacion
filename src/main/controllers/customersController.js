const { Customer } = require("../database/models")
const { Op } = require("sequelize")

const customersController = {
  async getAll(req, res) {
    try {
      const { page = 1, limit = 15, sortBy = "first_name", sortOrder = "ASC", search = "" } = req.query

      const offset = (page - 1) * limit
      const whereClause = {}

      if (search) {
        whereClause[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { company_name: { [Op.like]: `%${search}%` } },
          { document_number: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ]
      }

      const { count, rows } = await Customer.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]],
      })

      res.json({ customers: rows, totalItems: count })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async getById(req, res) {
    try {
      const customer = await Customer.findByPk(req.params.id)
      if (customer) {
        res.json(customer)
      } else {
        res.status(404).json({ error: "Cliente no encontrado" })
      }
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async create(req, res) {
    try {
      const customer = await Customer.create(req.body)
      res.status(201).json(customer)
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  },

  async update(req, res) {
    try {
      const [updated] = await Customer.update(req.body, {
        where: { id: req.params.id },
      })
      if (updated) {
        const updatedCustomer = await Customer.findByPk(req.params.id)
        res.json(updatedCustomer)
      } else {
        res.status(404).json({ error: "Cliente no encontrado" })
      }
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  },

  async delete(req, res) {
    try {
      const deleted = await Customer.destroy({
        where: { id: req.params.id },
      })
      if (deleted) {
        res.status(204).send()
      } else {
        res.status(404).json({ error: "Cliente no encontrado" })
      }
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}

module.exports = customersController