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
      if (!reconciliation) {
        return res.status(404).json({ message: "No reconciliation found for today" })
      }
      res.json(reconciliation)
    } catch (error) {
      res.status(500).json({ message: "Error fetching today's reconciliation", error: error.message })
    }
  }

  async getReport(req, res) {
    try {
      const { startDate, endDate } = req.query
      const report = await CashReconciliationService.getReconciliationReport(startDate, endDate)
      res.json(report)
    } catch (error) {
      res.status(500).json({ message: "Error fetching reconciliation report", error: error.message })
    }
  }

  async close(req, res) {
    try {
      const { id } = req.params
      const { closingBalance, notes } = req.body
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