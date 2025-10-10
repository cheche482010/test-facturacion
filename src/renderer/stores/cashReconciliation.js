import { defineStore } from 'pinia'
import { ref } from 'vue'
import cashReconciliationService from '@/services/cashReconciliationService'

export const useCashReconciliationStore = defineStore('cashReconciliation', () => {
  // --- STATE ---
  const todayReconciliation = ref(null)
  const weeklyReport = ref([])
  const monthlyReport = ref([])
  const isLoading = ref(false)
  const isReportLoading = ref(false)
  const error = ref(null)
  const reportError = ref(null)
  const dailyReport = ref(null)

  // --- HELPERS ---
  const formatDate = (date) => date.toISOString().split('T')[0]

  // --- ACTIONS ---

  /**
   * Carga el estado del arqueo del día actual desde el backend.
   */
  async function fetchTodayReconciliation() {
    isLoading.value = true
    error.value = null
    try {
      const data = await cashReconciliationService.getToday()
      todayReconciliation.value = data
    } catch (e) {
      // Si es un 404 (no encontrado), significa que no hay caja abierta, lo cual es un estado válido.
      if (e.message.includes('404')) {
        todayReconciliation.value = null
      } else {
        error.value = e.message
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDailyReport(reconciliationId) {
    isReportLoading.value = true
    reportError.value = null
    try {
      dailyReport.value = await cashReconciliationService.getDailyReport(reconciliationId)
    } catch (e) {
      reportError.value = e.message
    } finally {
      isReportLoading.value = false
    }
  }

  /**
   * Abre una nueva caja con un saldo inicial.
   * @param {object} data - Datos para la apertura.
   * @param {number} data.openingBalance - El saldo inicial.
   * @param {string} [data.notes] - Notas opcionales.
   */
  async function openReconciliation(data) {
    isLoading.value = true
    error.value = null
    try {
      const newReconciliation = await cashReconciliationService.open(data)
      todayReconciliation.value = newReconciliation
      // Después de abrir, volvemos a cargar los datos para obtener el estado completo
      await fetchTodayReconciliation()
    } catch (e) {
      error.value = e.message
      throw e // Relanzar para que el componente pueda manejarlo si es necesario
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Cierra la caja del día.
   * @param {object} data - Datos para el cierre.
   * @param {number} data.closingBalance - El saldo final contado.
   * @param {string} [data.notes] - Notas de cierre opcionales.
   */
  async function closeReconciliation(data) {
    if (!todayReconciliation.value) {
      const err = new Error('No hay un arqueo abierto para cerrar.')
      error.value = err.message
      throw err
    }
    isLoading.value = true
    error.value = null
    try {
      const closedReconciliation = await cashReconciliationService.close(todayReconciliation.value.id, data)
      todayReconciliation.value = null // La caja está cerrada, ya no hay arqueo "de hoy"
      return closedReconciliation
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchWeeklyReport() {
    isReportLoading.value = true
    reportError.value = null
    try {
      const today = new Date()
      const dayOfWeek = today.getDay() // Sunday - 0, Monday - 1, ...
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - dayOfWeek) // Start of the week (Sunday)

      weeklyReport.value = await cashReconciliationService.getReport({
        startDate: formatDate(startDate),
        endDate: formatDate(today),
      })
    } catch (e) {
      reportError.value = e.message
    } finally {
      isReportLoading.value = false
    }
  }

  async function fetchMonthlyReport() {
    isReportLoading.value = true
    reportError.value = null
    try {
      const today = new Date()
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1) // First day of the month

      monthlyReport.value = await cashReconciliationService.getReport({
        startDate: formatDate(startDate),
        endDate: formatDate(today),
      })
    } catch (e) {
      reportError.value = e.message
    } finally {
      isReportLoading.value = false
    }
  }

  return {
    todayReconciliation,
    weeklyReport,
    monthlyReport,
    dailyReport,
    isLoading,
    isReportLoading,
    error,
    reportError,
    fetchTodayReconciliation,
    openReconciliation,
    closeReconciliation,
    fetchWeeklyReport,
    fetchMonthlyReport,
    fetchDailyReport,
  }
})