const axios = require('axios')
const { DolarRate } = require('../database/models')

class DolarService {
  static async fetchDolarRate() {
    try {
      const response = await axios.get('https://ve.dolarapi.com/v1/dolares/oficial', {
        timeout: 10000 // 10 segundos timeout
      })

      const data = response.data
      if (data && data.promedio) {
        const rate = parseFloat(data.promedio).toFixed(2)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset time to start of day

        // Check if we already have a rate for today
        const existingRate = await DolarRate.findOne({
          where: {
            date: today
          }
        })

        if (existingRate) {
          // Update existing rate
          await existingRate.update({
            rate: rate,
            source: data.fuente || 'oficial',
            updatedAt: new Date()
          })
          return existingRate
        } else {
          // Create new rate
          const newRate = await DolarRate.create({
            rate: rate,
            date: today,
            source: data.fuente || 'oficial',
            updatedAt: new Date()
          })
          return newRate
        }
      } else {
        throw new Error('Invalid response from dolar API')
      }
    } catch (error) {
      console.error('Error fetching dolar rate:', error.message)
      throw error
    }
  }

  static async getCurrentDolarRate() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const rate = await DolarRate.findOne({
        where: {
          date: today
        },
        order: [['updatedAt', 'DESC']]
      })

      return rate
    } catch (error) {
      console.error('Error getting current dolar rate:', error.message)
      throw error
    }
  }

  static async getDolarHistory(limit = 30) {
    try {
      const rates = await DolarRate.findAll({
        order: [['date', 'DESC']],
        limit: limit
      })

      return rates
    } catch (error) {
      console.error('Error getting dolar history:', error.message)
      throw error
    }
  }

  static async updateDolarRate(rate, date = null) {
    try {
      const targetDate = date ? new Date(date) : new Date()
      targetDate.setHours(0, 0, 0, 0)

      const [updatedRate, created] = await DolarRate.upsert({
        date: targetDate,
        rate: parseFloat(rate).toFixed(2),
        source: 'manual',
        updatedAt: new Date()
      })

      return { updatedRate, created }
    } catch (error) {
      console.error('Error updating dolar rate:', error.message)
      throw error
    }
  }

  static async convertToBs(usdAmount) {
    try {
      const currentRate = await this.getCurrentDolarRate()
      if (!currentRate) {
        throw new Error('No current dolar rate available')
      }

      const bsAmount = parseFloat(usdAmount) * parseFloat(currentRate.rate)
      return bsAmount.toFixed(2)
    } catch (error) {
      console.error('Error converting to BS:', error.message)
      throw error
    }
  }
}

module.exports = DolarService