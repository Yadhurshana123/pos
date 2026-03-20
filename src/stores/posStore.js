import { create } from 'zustand'

export const usePosStore = create((set) => ({
  cart: [],
  customer: null,
  orderType: 'in-store',
  coupon: null,
  loyaltyRedeem: 0,
  parkedBills: [],
  favourites: [],

  addToCart: (product, size) => set(state => {
    const key = product.id + (size ? '__' + size : '')
    const existing = state.cart.find(i => i._key === key)
    if (existing) {
      return { cart: state.cart.map(i => i._key === key ? { ...i, qty: i.qty + 1 } : i) }
    }
    return { cart: [...state.cart, { ...product, qty: 1, _key: key, selectedSize: size || '' }] }
  }),

  removeFromCart: (key) => set(state => ({
    cart: state.cart.filter(i => i._key !== key)
  })),

  updateQty: (key, delta) => set(state => ({
    cart: state.cart.map(i => i._key === key ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0)
  })),

  setQty: (key, qty) => set(state => ({
    cart: state.cart.map(i => i._key === key ? { ...i, qty: Math.max(0, qty) } : i).filter(i => i.qty > 0)
  })),

  clearCart: () => set({ cart: [], customer: null, coupon: null, loyaltyRedeem: 0 }),
  setCustomer: (customer) => set({ customer }),
  setOrderType: (orderType) => set({ orderType }),
  setCoupon: (coupon) => set({ coupon }),
  setLoyaltyRedeem: (loyaltyRedeem) => set({ loyaltyRedeem }),

  parkBill: (note) => set(state => {
    const bill = {
      id: Date.now(),
      cart: [...state.cart],
      customer: state.customer,
      orderType: state.orderType,
      coupon: state.coupon,
      note: note || '',
      parkedAt: new Date().toISOString(),
    }
    return {
      parkedBills: [...state.parkedBills, bill],
      cart: [], customer: null, coupon: null, loyaltyRedeem: 0,
    }
  }),

  resumeBill: (billId) => set(state => {
    const bill = state.parkedBills.find(b => b.id === billId)
    if (!bill) return state
    return {
      cart: bill.cart, customer: bill.customer,
      orderType: bill.orderType, coupon: bill.coupon,
      parkedBills: state.parkedBills.filter(b => b.id !== billId),
    }
  }),

  toggleFavourite: (productId) => set(state => ({
    favourites: state.favourites.includes(productId)
      ? state.favourites.filter(id => id !== productId)
      : [...state.favourites, productId]
  })),
}))
