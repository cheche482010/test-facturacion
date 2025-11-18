import api from './api'

const cashReconciliationService = {
  /**
   * Obtiene el estado del arqueo de caja del día actual.
   * Puede devolver un arqueo abierto o null si no hay ninguno.
   */
  getToday() {
    return api.get('/cash-reconciliation/today')
  },

  /**
   * Crea una nueva apertura de caja.
   * @param {object} data - Datos para la apertura.
   * @param {number} data.openingBalance - El saldo inicial.
   * @param {string} [data.notes] - Notas opcionales.
   */
  open(data) {
    return api.post('/cash-reconciliation', data)
  },

  /**
   * Cierra el arqueo de caja actual.
   * @param {number} id - El ID del arqueo a cerrar.
   * @param {object} data - Datos para el cierre.
   * @param {number} data.closingBalance - El saldo final contado.
   * @param {string} [data.notes] - Notas de cierre opcionales.
   */
  close(id, data) {
    return api.put(`/cash-reconciliation/${id}/close`, data)
  },


  /**
   * Obtiene el reporte detallado de ventas para un arqueo específico.
   * @param {number} id - El ID del arqueo.
   */
  getDailyReport(id) {
    return api.get(`/cash-reconciliation/${id}/report`)
  },
}

export default cashReconciliationService