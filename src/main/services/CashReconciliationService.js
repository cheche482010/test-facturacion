const { CashReconciliation, Sale, Settings, User, DolarRate, SalePayment, PaymentMethod } = require("../database/models")
const { Op } = require("sequelize")
const { sequelize } = require("../database/connection")
const bcrypt = require("bcryptjs")

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

    // Asignar lote incremental
    const lastReconciliation = await CashReconciliation.findOne({
      order: [['id', 'DESC']],
    })
    const nextLoteNumber = lastReconciliation ? parseInt(lastReconciliation.lote || '0') + 1 : 1
    const lote = String(nextLoteNumber).padStart(3, '0')

    const reconciliation = await CashReconciliation.create({
      userId,
      openingBalance,
      openingDate: new Date(),
      notes,
      lote,
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

    // Calcular el total en USD usando la tasa del dólar del día actual
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const dolarRate = await DolarRate.findOne({
      where: { date: today }
    })

    const totalSalesUsd = dolarRate ? salesData.totalSalesBs / dolarRate.rate : 0

    return {
      ...reconciliation.toJSON(),
      totalSales: salesData.totalSalesBs, // Para compatibilidad con el frontend
      totalSalesBs: salesData.totalSalesBs,
      totalSalesUsd: totalSalesUsd,
      salesCount: salesData.salesCount,
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

    // Obtener la tasa del dólar del día de cierre
    const closingDate = new Date()
    const dateString = closingDate.toISOString().split('T')[0] // YYYY-MM-DD
    const dolarRate = await DolarRate.findOne({
      where: { date: dateString }
    })

    if (!dolarRate) {
      throw new Error(`No se encontró la tasa de cambio para la fecha ${dateString}`)
    }

    const totalSalesBs = salesData.totalSalesBs
    const totalSalesUsd = totalSalesBs / dolarRate.rate

    reconciliation.closingDate = closingDate
    reconciliation.closingBalance = closingBalance
    reconciliation.notes = `${reconciliation.notes || ""}\nCierre: ${notes}`.trim()
    reconciliation.totalSales = totalSalesBs
    reconciliation.totalSalesUsd = totalSalesUsd

    await reconciliation.save()
    return reconciliation
  }

  /**
   * Calcula los datos de ventas para un período.
   * @param {Date} startDate - Fecha de inicio.
   * @param {Date} endDate - Fecha de fin.
   * @returns {Promise<object>} Un objeto con el total de ventas en BS y USD.
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

    const totalSalesBs = sales.reduce((sum, sale) => sum + parseFloat(sale.totalBs || 0), 0)
    // totalSalesUsd será calculado como totalSalesBs dividido por la tasa del dólar del día de cierre
    const totalSalesUsd = 0 // Se calculará al momento del cierre con la tasa actual

    return {
      totalSalesBs,
      totalSalesUsd,
      salesCount: sales.length,
    }
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

    // Obtener ventas con pagos incluidos
    const sales = await Sale.findAll({
      where: {
        sale_date: {
          [Op.between]: [reconciliation.openingDate, new Date()],
        },
        status: "completada",
      },
      include: [
        { model: User, as: "user", attributes: ["username"] },
        {
          model: require('../database/models').SalePayment,
          as: "payments",
          include: [{
            model: require('../database/models').PaymentMethod,
            as: "paymentMethod",
            attributes: ["name"]
          }],
          attributes: []
        },
      ],
      order: [["sale_date", "ASC"]],
    })

    const summary = await this.calculateSalesData(reconciliation.openingDate, new Date())

    // Calcular desglose por método de pago
    const paymentMethodBreakdown = {}
    let totalChangeGivenBs = 0

    for (const sale of sales) {
      totalChangeGivenBs += parseFloat(sale.changeGivenBs || 0)

      // Agregar método de pago principal (asumiendo el primero, o "Efectivo" por defecto)
      let paymentMethod = "Efectivo BS" // Valor por defecto
      if (sale.payments && sale.payments.length > 0) {
        paymentMethod = sale.payments[0].paymentMethod?.name || "Efectivo BS"
      }

      if (!paymentMethodBreakdown[paymentMethod]) {
        paymentMethodBreakdown[paymentMethod] = 0
      }
      paymentMethodBreakdown[paymentMethod] += parseFloat(sale.totalBs || 0)
    }

    // Calcular total en USD usando la tasa del día actual
    const today = new Date().toISOString().split('T')[0]
    const dolarRate = await DolarRate.findOne({
      where: { date: today }
    })

    const totalSalesUsd = dolarRate ? summary.totalSalesBs / dolarRate.rate : 0
    const totalChangeGivenUsd = dolarRate ? totalChangeGivenBs / dolarRate.rate : 0

    // Preparar datos de ventas para el frontend
    const salesData = sales.map(sale => {
      let paymentMethod = "Efectivo BS" // Valor por defecto
      if (sale.payments && sale.payments.length > 0) {
        paymentMethod = sale.payments[0].paymentMethod?.name || "Efectivo BS"
      }

      return {
        id: sale.id,
        saleNumber: sale.saleNumber,
        total: sale.totalBs,
        totalBs: sale.totalBs,
        totalUsd: dolarRate ? sale.totalBs / dolarRate.rate : 0,
        paymentMethod: paymentMethod,
        changeGivenBs: sale.changeGivenBs || 0,
        changeGivenUsd: sale.changeGivenUsd || 0,
        sale_date: sale.sale_date,
      }
    })

    const enhancedSummary = {
      ...summary,
      totalSalesUsd,
      totalChangeGivenBs,
      totalChangeGivenUsd,
      paymentMethodBreakdown,
    }

    return {
      reconciliation,
      sales: salesData,
      summary: enhancedSummary,
    }
  }

  /**
   * Verifica la contraseña de administrador para cierres de caja.
   * @param {string} password - Contraseña a verificar.
   * @returns {Promise<boolean>} True si la contraseña es correcta.
   */
  async verifyAdminPassword(password) {
    // Buscar usuario administrador (asumiendo que hay uno con rol 'administrador')
    const adminUser = await User.findOne({
      where: {
        role: "administrador",
        isActive: true
      }
    })

    if (!adminUser) {
      return false
    }

    return await bcrypt.compare(password, adminUser.password)
  }
}

module.exports = new CashReconciliationService()