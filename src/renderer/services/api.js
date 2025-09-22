import { useAuthStore } from "@/stores/auth.js"

const BASE_URL = "/api" // Vite proxy se encargará de redirigir

async function request(url, options = {}) {
  // Es importante obtener el store aquí dentro para evitar problemas de ciclo de importación
  const authStore = useAuthStore()
  const token = authStore.token

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    // Si el token es inválido (401 Unauthorized) y hay un token, deslogueamos al usuario.
    if (response.status === 401 && authStore.token) {
      authStore.logout()
    }
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
  }

  // Manejar diferentes tipos de respuesta
  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    return response.json()
  }

  return response // Devolver la respuesta completa para otros tipos (ej. blob para PDF)
}

export default {
  get: (url, options) => request(url, { ...options, method: "GET" }),
  post: (url, body, options) => request(url, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: (url, body, options) => request(url, { ...options, method: "PUT", body: JSON.stringify(body) }),
  delete: (url, options) => request(url, { ...options, method: "DELETE" }),
}
