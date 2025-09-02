import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || null)
  const userPermissions = computed(() => user.value?.permissions || {})

  // Configurar axios
  const setupAxios = () => {
    if (token.value) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }

  // Métodos
  const login = async (credentials) => {
    try {
      loading.value = true
      error.value = null
      console.log(credentials)
      const response = await axios.post('/api/auth/login', credentials)
      
      if (response.data.success) {
        const { token: newToken, user: userData } = response.data.data
        
        token.value = newToken
        user.value = userData
        
        localStorage.setItem('token', newToken)
        setupAxios()
        
        return { success: true }
      } else {
        error.value = response.data.message
        return { success: false, message: response.data.message }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error de conexión'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const register = async (userData) => {
    try {
      loading.value = true
      error.value = null

      const response = await axios.post('/api/auth/register', userData)
      
      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data.data
        
        token.value = newToken
        user.value = newUser
        
        localStorage.setItem('token', newToken)
        setupAxios()
        
        return { success: true }
      } else {
        error.value = response.data.message
        return { success: false, message: response.data.message }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error de conexión'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const getUser = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await axios.get('/api/auth/me')
      
      if (response.data.success) {
        user.value = response.data.data.user
        return { success: true }
      } else {
        error.value = response.data.message
        return { success: false, message: response.data.message }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error de conexión'
      logout()
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    error.value = null
    
    localStorage.removeItem('token')
    setupAxios()
  }

  const changePassword = async (passwordData) => {
    try {
      loading.value = true
      error.value = null

      const response = await axios.post('/api/auth/change-password', passwordData)
      
      if (response.data.success) {
        return { success: true, message: response.data.message }
      } else {
        error.value = response.data.message
        return { success: false, message: response.data.message }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error de conexión'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const verifyToken = async () => {
    try {
      const response = await axios.get('/api/auth/verify')
      return response.data.success
    } catch (err) {
      return false
    }
  }

  const hasPermission = (resource, action) => {
    if (!user.value?.permissions) return false
    
    const permissions = user.value.permissions[resource] || []
    return permissions.includes(action)
  }

  const hasRole = (role) => {
    return user.value?.role === role
  }

  const hasAnyRole = (roles) => {
    return roles.includes(user.value?.role)
  }

  // Inicializar axios
  setupAxios()

  return {
    // Estado
    token,
    user,
    loading,
    error,
    
    // Getters
    isAuthenticated,
    userRole,
    userPermissions,
    
    // Métodos
    login,
    register,
    getUser,
    logout,
    changePassword,
    verifyToken,
    hasPermission,
    hasRole,
    hasAnyRole
  }
})

