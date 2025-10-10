const { CashReconciliation, Sale, Settings, User } = require("../database/models")
const { Op } = require("sequelize")
const { sequelize } = require("../database/connection")

class CashReconciliationService {
  /**
   * Obtiene la hora de apertura del negocio desde la configuración.
   * @returns {Promise<string>} La hora de apertura en formato "HH:mm".
   */
  async getBusinessOpeningTime() {
    const setting = await Settings.findOne({ where: { key: "business_opening_time" } })
    return setting ? setting.value : "09:00" // Valor por defecto si no se encuentra
  }

  /**
   * Calcula la fecha de inicio del día de negocio actual.
   * @returns {Promise<Date>} La fecha y hora de inicio.
   */
  async getStartOfBusinessDay() {
    const openingTime = await this.getBusinessOpeningTime()
    const [hours, minutes] = openingTime.split(":")
    const now = new Date()
    const startOfBusinessDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0)

    // Si la hora actual es antes de la hora de apertura, el día de negocio es el de ayer.
    if (now < startOfBusinessDay) {
      startOfBusinessDay.setDate(startOfBusinessDay.getDate() - 1)
    }

    return startOfBusinessDay
  }

  /**
   * Crea una nueva apertura de caja (reconciliación).
   * @param {number} userId - ID del usuario que realiza la apertura.
   * @param {number} openingBalance - Saldo inicial en caja.
   * @param {string} [notes] - Notas adicionales.
   * @returns {Promise<CashReconciliation>} La reconciliación creada.
   */
  async createReconciliation(userId, openingBalance, notes = "") {
    const todayStart = await this.getStartOfBusinessDay()

    const existingReconciliation = await CashReconciliation.findOne({
      where: {
        openingDate: {
          [Op.gte]: todayStart,
        },
        closingDate: null, // Buscar una que aún no esté cerrada
      },
    })

    if (existingReconciliation) {
      throw new Error("Ya existe una caja abierta para el día de hoy.")
    }

    const reconciliation = await CashReconciliation.create({
      userId,
      openingBalance,
      openingDate: new Date(),
      notes,
      // closingDate, closingBalance y totalSales se llenarán al cerrar
    })

    return reconciliation
  }

  /**
   * Obtiene la reconciliación activa del día de hoy.
   * @returns {Promise<CashReconciliation|null>} La reconciliación activa o null si no hay.
   */
  async getTodayReconciliation() {
    const startOfBusinessDay = await this.getStartOfBusinessDay()

    const reconciliation = await CashReconciliation.findOne({
      where: {
        openingDate: {
          [Op.gte]: startOfBusinessDay,
        },
        closingDate: null, // Solo las que están abiertas
      },
      include: [{ model: User, as: "user", attributes: ["id", "username", "firstName", "lastName"] }],
    })

    if (!reconciliation) {
      return null
    }

    // Si hay una reconciliación, calculamos las ventas hasta el momento.
    const salesData = await this.calculateSalesData(reconciliation.openingDate, new Date())

    return {
      ...reconciliation.toJSON(),
      ...salesData,
    }
  }

  /**
   * Cierra la caja del día.
   * @param {number} reconciliationId - ID de la reconciliación a cerrar.
   * @param {number} closingBalance - Monto contado al cerrar.
   * @param {string} [notes] - Notas de cierre.
   * @returns {Promise<CashReconciliation>}
   */
  async closeReconciliation(reconciliationId, closingBalance, notes = "") {
    const reconciliation = await CashReconciliation.findByPk(reconciliationId)
    if (!reconciliation) {
      throw new Error("Reconciliación no encontrada.")
    }
    if (reconciliation.closingDate) {
      throw new Error("Esta caja ya ha sido cerrada.")
    }

    const salesData = await this.calculateSalesData(reconciliation.openingDate, new Date())

    reconciliation.closingDate = new Date()
    reconciliation.closingBalance = closingBalance
    reconciliation.notes = `${reconciliation.notes || ""}\nCierre: ${notes}`.trim()
    reconciliation.totalSales = salesData.totalSales
    // Podríamos añadir más campos para el desglose si el modelo los tuviera

    await reconciliation.save()
    return reconciliation
  }

  /**
   * Calcula los datos de ventas para un período.
   * @param {Date} startDate - Fecha de inicio.
   * @param {Date} endDate - Fecha de fin.
   * @returns {Promise<object>} Un objeto con el total de ventas y el desglose por método de pago.
   */
  async calculateSalesData(startDate, endDate) {
    const sales = await Sale.findAll({
      where: {
        sale_date: {
          [Op.between]: [startDate, endDate],
        },
        status: "completada", // Solo ventas completadas
      },
    })

    const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total), 0)

    const paymentMethodBreakdown = sales.reduce((acc, sale) => {
      const method = sale.paymentMethod
      const total = parseFloat(sale.total)
      if (!acc[method]) {
        acc[method] = 0
      }
      acc[method] += total
      return acc
    }, {})

    return {
      totalSales,
      paymentMethodBreakdown,
      salesCount: sales.length,
    }
  }

  /**
   * Obtiene un reporte de reconciliaciones en un rango de fechas.
   * @param {string} startDate - Fecha de inicio (YYYY-MM-DD).
   * @param {string} endDate - Fecha de fin (YYYY-MM-DD).
   * @returns {Promise<CashReconciliation[]>}
   */
  async getReconciliationReport(startDate, endDate) {
    const report = await CashReconciliation.findAll({
      where: {
        closingDate: {
          [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`],
        },
      },
      include: [{ model: User, as: "user", attributes: ["username"] }],
      order: [["closingDate", "DESC"]],
    })

    return report
  }

  /**
   * Genera un reporte detallado de ventas para un arqueo específico.
   * @param {number} reconciliationId - El ID del arqueo.
   * @returns {Promise<object>}
   */
  async getDailySalesReport(reconciliationId) {
    const reconciliation = await CashReconciliation.findByPk(reconciliationId, {
      include: [{ model: User, as: "user", attributes: ["username"] }],
    })

    if (!reconciliation) {
      throw new Error("Arqueo de caja no encontrado.")
    }

    const sales = await Sale.findAll({
      where: {
        sale_date: {
          [Op.between]: [reconciliation.openingDate, new Date()],
        },
        status: "completada",
      },
      include: [{ model: User, as: "user", attributes: ["username"] }],
      order: [["sale_date", "ASC"]],
    })

    const summary = await this.calculateSalesData(reconciliation.openingDate, new Date())

    return {
      reconciliation,
      sales,
      summary,
    }
  }
}

module.exports = new CashReconciliationService()