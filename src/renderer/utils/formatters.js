export const formatCurrency = (value = 0, currency = 'VES') => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  }
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(value)
}

export const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  })
}
