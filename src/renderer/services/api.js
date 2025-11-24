import { useAuthStore } from "@/stores/auth.js"

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`

async function request(url, options = {}) {
  
  const authStore = useAuthStore()
  const token = authStore.token

  const headers = { ...options.headers }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {

    if (response.status === 401 && authStore.token) {
      authStore.logout()
    }

    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
  }

  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    return response.json()
  }

  return response 
}

export default {
  get: (url, options) => request(url, { ...options, method: "GET" }),
  post: (url, body, options) => {
    const isFormData = body instanceof FormData
    return request(url, {
      ...options,
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    })
  },
  put: (url, body, options) => {
    const isFormData = body instanceof FormData
    return request(url, {
      ...options,
      method: "PUT",
      body: isFormData ? body : JSON.stringify(body),
    })
  },
  delete: (url, options) => request(url, { ...options, method: "DELETE" }),
}
