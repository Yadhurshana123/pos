export function sanitizeInput(str) {
  if (typeof str !== 'string') return str
  return str.replace(/<[^>]*>/g, '').replace(/[<>"'&]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;'
  })[c] || c)
}

export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, typeof v === 'string' ? sanitizeInput(v) : v])
  )
}
