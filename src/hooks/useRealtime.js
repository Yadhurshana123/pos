import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export function useRealtimeSubscription(table, queryKeysToInvalidate = []) {
  const qc = useQueryClient()
  const channelRef = useRef(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        queryKeysToInvalidate.forEach((key) => {
          qc.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] })
        })
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [table, JSON.stringify(queryKeysToInvalidate)])
}

export function useRealtimeOrders() {
  useRealtimeSubscription('orders', ['orders'])
}

export function useRealtimeInventory() {
  useRealtimeSubscription('inventory', ['inventory', 'products'])
}

export function useRealtimeReturns() {
  useRealtimeSubscription('returns', ['returns'])
}

export function useRealtimeCashSessions() {
  useRealtimeSubscription('cash_sessions', ['cash-sessions'])
}
