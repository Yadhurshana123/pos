import dayjs from 'dayjs'

export const fmt = (n, sym = "£") => `${sym}${Number(n || 0).toFixed(2)}`
export const ts = () => dayjs().format('DD/MM/YYYY, HH:mm:ss')
export const genId = (p) => `${p}-${String(Math.floor(Math.random() * 9000) + 1000)}`
export const isBannerActive = (b) => {
  const now = new Date()
  const s = new Date(b.startDate)
  const e = new Date(b.endDate)
  return b.active && now >= s && now <= e
}
export const getTier = (spent) => {
  if (spent >= 1500) return "Gold"
  if (spent >= 500) return "Silver"
  return "Bronze"
}
