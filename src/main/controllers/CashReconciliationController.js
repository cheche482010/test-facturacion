const CashReconciliationService = require("../services/CashReconciliationService")

class CashReconciliationController {
  async create(req, res) {
    try {
      const { openingBalance, notes } = req.body
      const userId = req.user.id
      const reconciliation = await CashReconciliationService.createReconciliation(userId, openingBalance, notes)
      res.status(201).json(reconciliation)
    } catch (error) {
      res.status(500).json({ message: "Error creating reconciliation", error: error.message })
    }
  }

  async getToday(req, res) {
    try {
      const reconciliation = await CashReconciliationService.getTodayReconciliation()
      // Devolver null en lugar de 404 cuando no hay reconciliación abierta
      res.json(reconciliation)
    } catch (error) {
      res.status(500).json({ message: "Error fetching today's reconciliation", error: error.message })
    }
  }


  async close(req, res) {
    try {
      const { id } = req.params
      const { closingBalance, notes, adminPassword } = req.body
      const userRole = req.user.role

      // If user is cajero, require admin password for closure
      if (userRole === "cajero") {
        if (!adminPassword) {
          return res.status(400).json({ message: "Se requiere contraseña de administrador para cerrar caja" })
        }

        // Verify admin password (this would need to be implemented in the service)
        const isValidAdminPassword = await CashReconciliationService.verifyAdminPassword(adminPassword)
        if (!isValidAdminPassword) {
          return res.status(403).json({ message: "Contraseña de administrador incorrecta" })
        }
      }

      const reconciliation = await CashReconciliationService.closeReconciliation(id, closingBalance, notes)
      res.json(reconciliation)
    } catch (error) {
      res.status(500).json({ message: "Error closing reconciliation", error: error.message })
    }
  }

  async getReportById(req, res) {
    try {
      const { id } = req.params
      const report = await CashReconciliationService.getDailySalesReport(id)
      res.json(report)
    } catch (error) {
      res.status(500).json({ message: "Error fetching daily sales report", error: error.message })
    }
  }
}

module.exports = new CashReconciliationController()