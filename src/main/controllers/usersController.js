const { User } = require("../database/models")

const usersController = {
  async getAll(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ["password"] },
        order: [["createdAt", "DESC"]],
      })
      res.json({ users })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async create(req, res) {
    try {
      const { username, password, firstName, lastName, role, isActive = true } = req.body

      const existingUser = await User.findOne({ where: { username } })
      if (existingUser) {
        return res.status(400).json({ error: "El nombre de usuario ya existe" })
      }

      const user = await User.create({
        username,
        password,
        firstName,
        lastName,
        role,
        isActive,
      })

      const userResponse = user.toJSON()
      delete userResponse.password

      res.status(201).json({ user: userResponse })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params
      const { username, firstName, lastName, role, isActive, password } = req.body

      const user = await User.findByPk(id)
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" })
      }

      if (username && username !== user.username) {
        const existingUser = await User.findOne({ where: { username } })
        if (existingUser) {
          return res.status(400).json({ error: "El nombre de usuario ya existe" })
        }
      }

      const updateData = { username, firstName, lastName, role, isActive }
      if (password) {
        updateData.password = password
      }

      await user.update(updateData)

      const userResponse = user.toJSON()
      delete userResponse.password

      res.json({ user: userResponse })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params

      if (Number.parseInt(id) === req.user.id) {
        return res.status(400).json({ error: "No puedes eliminar tu propio usuario" })
      }

      const user = await User.findByPk(id)
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" })
      }

      await user.destroy()
      res.json({ message: "Usuario eliminado exitosamente" })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}

module.exports = usersController