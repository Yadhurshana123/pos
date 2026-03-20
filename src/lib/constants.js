export const APP_NAME = 'SCSTix EPOS'
export const APP_VERSION = '1.0.0'

export const CATEGORIES = ["All", "Jerseys", "Training Wear", "Fan Accessories", "Football Equipment", "Collectibles"]

export const TIER_CONFIG = {
  Bronze: { min: 0, max: 499, color: "#cd7f32", bg: "#2a1a0a", label: "Bronze", icon: "🥉" },
  Silver: { min: 500, max: 1499, color: "#9ca3af", bg: "#1a1f2a", label: "Silver", icon: "🥈" },
  Gold: { min: 1500, max: Infinity, color: "#f59e0b", bg: "#2a1e00", label: "Gold", icon: "🥇" },
}

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  STAFF: 'staff',
  CUSTOMER: 'customer',
}

export const ORDER_TYPES = {
  IN_STORE: 'in-store',
  DELIVERY: 'delivery',
  PICKUP: 'pickup',
  ONLINE: 'online',
}

export const PAYMENT_METHODS = {
  CASH: 'Cash',
  CARD: 'Card',
  QR: 'QR',
  SPLIT: 'Split',
  ONLINE: 'Online',
}

export const RETURN_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

export const MOVEMENT_TYPES = {
  RECEIVE: 'receive',
  SELL: 'sell',
  RETURN: 'return',
  ADJUST: 'adjust',
  TRANSFER: 'transfer',
  DAMAGE: 'damage',
  LOSS: 'loss',
}
