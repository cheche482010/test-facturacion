const { CashReconciliation, Sale, Settings, User, DolarRate, SalePayment, PaymentMethod } = require("../database/models")
const { Op } = require("sequelize")
const { sequelize } = require("../database/connection")
const bcrypt = require("bcryptjs")

class CashReconciliationService {

  async getBusinessOpeningTime() {
    const setting = await Settings.findOne({ where: { key: "business_opening_time" } })
    return setting ? setting.value : "09:00" 
  }

  async getStartOfBusinessDay() {
    const openingTime = await this.getBusinessOpeningTime()
    const [hours, minutes] = openingTime.split(":")
    const now = new Date()
    const startOfBusinessDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0)

    if (now < startOfBusinessDay) {
      startOfBusinessDay.setDate(startOfBusinessDay.getDate() - 1)
    }

    return startOfBusinessDay
  }

  async createReconciliation(userId, openingBalanceBs = 0, openingBalanceUsd = 0, notes = "") {
    const todayStart = await this.getStartOfBusinessDay()

    const existingReconciliation = await CashReconciliation.findOne({
      where: {
        openingDate: {
          [Op.gte]: todayStart,
        },
        closingDate: null, 
      },
    })

    if (existingReconciliation) {
      throw new Error("Ya existe una caja abierta para el día de hoy.")
    }

    const lastReconciliation = await CashReconciliation.findOne({
      order: [['id', 'DESC']],
    })
    const nextLoteNumber = lastReconciliation ? parseInt(lastReconciliation.lote || '0') + 1 : 1
    const lote = String(nextLoteNumber).padStart(3, '0')

    const reconciliation = await CashReconciliation.create({
      userId,
      openingBalanceBs,
      openingBalanceUsd,
      openingBalance: openingBalanceBs, 
      openingDate: new Date(),
      notes,
      lote,
    })

    return reconciliation
  }

  async getTodayReconciliation() {
    const startOfBusinessDay = await this.getStartOfBusinessDay()

    const reconciliation = await CashReconciliation.findOne({
      where: {
        openingDate: {
          [Op.gte]: startOfBusinessDay,
        },
        closingDate: null,  
      },
      include: [{ model: User, as: "user", attributes: ["id", "username", "firstName", "lastName"] }],
    })

    if (!reconciliation) {
      return null
    }

    const salesData = await this.calculateSalesData(reconciliation.openingDate, new Date())

    const today = new Date().toISOString().split('T')[0]
    const dolarRate = await DolarRate.findOne({
      where: { date: today }
    })

    const totalSalesUsd = dolarRate ? salesData.totalSalesBs / dolarRate.rate : 0

    return {
      ...reconciliation.toJSON(),
      totalSales: salesData.totalSalesBs, 
      totalSalesBs: salesData.totalSalesBs,
      totalSalesUsd: totalSalesUsd,
      salesCount: salesData.salesCount,
    }
  }

 
  async closeReconciliation(reconciliationId, closingBalanceBs, closingBalanceUsd, notes = "") {
    const reconciliation = await CashReconciliation.findByPk(reconciliationId)
    if (!reconciliation) {
      throw new Error("Reconciliación no encontrada.")
    }
    if (reconciliation.closingDate) {
      throw new Error("Esta caja ya ha sido cerrada.")
    }

    const salesData = await this.calculateSalesData(reconciliation.openingDate, new Date())

    const closingDate = new Date()
    const dateString = closingDate.toISOString().split('T')[0] 
    const dolarRate = await DolarRate.findOne({
      where: { date: dateString }
    })

    if (!dolarRate) {
      throw new Error(`No se encontró la tasa de cambio para la fecha ${dateString}`)
    }

    const totalSalesBs = salesData.totalSalesBs
    const totalSalesUsd = totalSalesBs / dolarRate.rate

    reconciliation.closingDate = closingDate
    reconciliation.closingBalanceBs = closingBalanceBs
    reconciliation.closingBalanceUsd = closingBalanceUsd
    reconciliation.closingBalance = closingBalanceBs 
    reconciliation.notes = `${reconciliation.notes || ""}\nCierre: ${notes}`.trim()
    reconciliation.totalSales = totalSalesBs
    reconciliation.totalSalesUsd = totalSalesUsd

    await reconciliation.save()
    return reconciliation
  }


  async calculateSalesData(startDate, endDate) {
    const sales = await Sale.findAll({
      where: {
        sale_date: {
          [Op.between]: [startDate, endDate],
        },
        status: "completada",
      },
    })

    const totalSalesBs = sales.reduce((sum, sale) => sum + parseFloat(sale.totalBs || 0), 0)
    const totalSalesUsd = 0 

    return {
      totalSalesBs,
      totalSalesUsd,
      salesCount: sales.length,
    }
  }


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

    const paymentMethodBreakdown = {}
    let totalChangeGivenBs = 0

    for (const sale of sales) {
      totalChangeGivenBs += parseFloat(sale.changeGivenBs || 0)
      let paymentMethod = "Efectivo BS" 
      if (sale.payments && sale.payments.length > 0) {
        paymentMethod = sale.payments[0].paymentMethod?.name || "Efectivo BS"
      }

      if (!paymentMethodBreakdown[paymentMethod]) {
        paymentMethodBreakdown[paymentMethod] = 0
      }
      paymentMethodBreakdown[paymentMethod] += parseFloat(sale.totalBs || 0)
    }

    const today = new Date().toISOString().split('T')[0]
    const dolarRate = await DolarRate.findOne({
      where: { date: today }
    })

    const totalSalesUsd = dolarRate ? summary.totalSalesBs / dolarRate.rate : 0
    const totalChangeGivenUsd = dolarRate ? totalChangeGivenBs / dolarRate.rate : 0

    const salesData = sales.map(sale => {
      let paymentMethod = "Efectivo BS" 
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

 
  async verifyAdminPassword(password) {
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