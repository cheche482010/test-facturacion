export const formatCurrency = (value = 0) => {
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
