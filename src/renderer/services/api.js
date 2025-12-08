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

  const contentType = response.headers.get("content-type")
  let responseData = null

  if (contentType && contentType.includes("application/json")) {
    responseData = await response.json()
  }

  if (responseData && responseData.error) {
    throw new Error(responseData.error)
  }

  if (!response.ok) {
    if (response.status === 401 && authStore.token) {
      authStore.logout()
    }

    let errorMessage = `Error ${response.status}: ${response.statusText}`

    if (responseData && (responseData.message || responseData.error)) {
      errorMessage = responseData.message || responseData.error
    }

    throw new Error(errorMessage)
  }

  return responseData || response
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
