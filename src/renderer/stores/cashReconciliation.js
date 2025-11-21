import { defineStore } from 'pinia'
import { ref } from 'vue'
import cashReconciliationService from '@/services/cashReconciliationService'

export const useCashReconciliationStore = defineStore('cashReconciliation', () => {

  const todayReconciliation = ref(null)
  const isLoading = ref(false)
  const isReportLoading = ref(false)
  const error = ref(null)
  const reportError = ref(null)
  const dailyReport = ref(null)
  const formatDate = (date) => date.toISOString().split('T')[0]

  async function fetchTodayReconciliation() {
    isLoading.value = true
    error.value = null
    try {
      const data = await cashReconciliationService.getToday()
      todayReconciliation.value = data
    } catch (e) {
      error.value = e.message
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

  async function openReconciliation(data) {
    isLoading.value = true
    error.value = null
    try {
      const newReconciliation = await cashReconciliationService.open(data)
      todayReconciliation.value = newReconciliation
      await fetchTodayReconciliation()
    } catch (e) {
      error.value = e.message
      throw e 
    } finally {
      isLoading.value = false
    }
  }

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
      todayReconciliation.value = null 
      return closedReconciliation
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      isLoading.value = false
    }
  }

  return {
    todayReconciliation,
    dailyReport,
    isLoading,
    isReportLoading,
    error,
    reportError,
    fetchTodayReconciliation,
    openReconciliation,
    closeReconciliation,
    fetchDailyReport,
  }
})