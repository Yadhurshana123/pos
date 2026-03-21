import { create } from 'zustand'

export const useAppStore = create((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  /** Cashier desktop: fully hide sidebar; hamburger toggles this */
  sidebarHidden: false,
  notifications: [
    { id: 1, msg: "Welcome to SCSTix EPOS! Check today's offers.", type: "info", read: false, time: "09:00" },
  ],

  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSidebarCollapsed: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleSidebarHidden: () => set(state => ({ sidebarHidden: !state.sidebarHidden })),
  closeSidebar: () => set({ sidebarOpen: false }),
  openSidebar: () => set({ sidebarOpen: true }),

  addNotification: (msg, type = 'info') => set(state => ({
    notifications: [
      { id: Date.now(), msg, type, read: false, time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) },
      ...state.notifications.slice(0, 19)
    ]
  })),

  markNotificationRead: (id) => set(state => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),

  markAllRead: () => set(state => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),

  clearNotifications: () => set({ notifications: [] }),
}))
