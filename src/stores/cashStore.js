import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { genId, ts } from '@/lib/utils'
import { openSession, closeSession, recordCashMovement, getActiveSession } from '@/services/cash'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const useCashStore = create(
  persist(
    (set, get) => ({
      session: null,
      movements: [],
      history: [],
      isLoading: true,

      // Load active session from Supabase on app start
      loadSession: async (counterId) => {
        set({ isLoading: true })
        if (!isSupabaseConfigured()) {
          set({ isLoading: false })
          return
        }
        try {
          const active = await getActiveSession(counterId)
          if (active) {
            // Fetch movements for this session
            const { data: movs } = await supabase
              .from('cash_movements')
              .select('*')
              .eq('session_id', active.id)
              .order('created_at', { ascending: false })

            const mappedMovements = (movs || []).map(m => ({
              id: m.id,
              type: m.type,
              amount: Number(m.amount),
              note: m.notes || '',
              time: new Date(m.created_at).toLocaleString(),
              by: m.created_by_name || 'System'
            }))

            set({
              session: {
                id: active.id,
                openFloat: Number(active.opening_float),
                openedAt: new Date(active.opened_at).toLocaleString(),
                openedAtRaw: active.opened_at,
                openedBy: active.opened_by_name || 'Cashier',
                status: 'open',
                _supabaseId: active.id
              },
              movements: mappedMovements
            })
          }

          // Fetch session history
          const { data: hist } = await supabase
            .from('cash_sessions')
            .select('*')
            .eq('status', 'closed')
            .order('closed_at', { ascending: false })
            .limit(10)

          if (hist && hist.length > 0) {
            set({
              history: hist.map(h => ({
                id: h.id,
                openFloat: Number(h.opening_float),
                openedAt: new Date(h.opened_at).toLocaleString(),
                closedAt: h.closed_at ? new Date(h.closed_at).toLocaleString() : '',
                openedBy: h.opened_by_name || 'Cashier',
                closedBy: h.closed_by_name || 'Cashier',
                status: 'closed',
                actualCash: Number(h.closing_cash || 0),
                expectedCash: Number(h.expected_cash || 0),
                variance: Number(h.variance || 0)
              }))
            })
          }
          set({ isLoading: false })
        } catch (err) {
          console.error('Failed to load cash session from Supabase:', err)
          set({ isLoading: false })
        }
      },

      openTill: async (user, amount, siteId, counterId) => {
        // Local state update first (instant UI)
        const localId = genId('SESS')
        const s = {
          id: localId,
          openFloat: amount,
          openedAt: ts(),
          openedAtRaw: new Date().toISOString(),
          openedBy: user?.name || 'Cashier',
          status: 'open'
        }
        const m = {
          id: genId('MOV'),
          type: 'open',
          amount: amount,
          note: 'Opening float',
          time: ts(),
          by: user?.name || 'Cashier'
        }
        set({ session: s, movements: [m] })

        // Persist to Supabase
        if (isSupabaseConfigured()) {
          try {
            const dbSiteId = siteId || 'b0000000-0000-0000-0000-000000000001'
            const dbCounterId = counterId || user?.counter_id || 'c0000000-0000-0000-0000-000000000001'
            const dbSession = await openSession(dbSiteId, dbCounterId, user?.id, amount)
            // Update local state with Supabase ID
            set(state => ({
              session: { ...state.session, id: dbSession.id, _supabaseId: dbSession.id, openedAtRaw: dbSession.opened_at }
            }))
            // Record the opening movement
            await recordCashMovement(dbSession.id, 'float', amount, null, 'Opening float', user?.id)
          } catch (err) {
            console.error('Failed to save session to Supabase:', err)
          }
        }
      },

      addMovement: async (type, amount, note, user) => {
        const { session } = get()
        if (!session) return

        // Local state update first (instant UI)
        const m = {
          id: genId('MOV'),
          type,
          amount,
          note,
          time: ts(),
          by: user?.name || 'Cashier'
        }
        set((state) => ({ movements: [m, ...state.movements] }))

        // Persist to Supabase
        if (isSupabaseConfigured() && session._supabaseId) {
          try {
            await recordCashMovement(session._supabaseId, type, amount, null, note, user?.id)
          } catch (err) {
            console.error('Failed to save movement to Supabase:', err)
          }
        }
      },

      closeTill: async (actual, expected, user) => {
        const { session, movements } = get()
        if (!session) return

        const variance = Math.round((actual - expected) * 100) / 100
        const closed = {
          ...session,
          closedAt: ts(),
          closedBy: user?.name || 'Cashier',
          status: 'closed',
          actualCash: actual,
          expectedCash: expected,
          variance,
          movements: [...movements]
        }

        // Local state update first (instant UI)
        set((state) => ({
          history: [closed, ...state.history],
          session: null,
          movements: []
        }))

        // Persist to Supabase
        if (isSupabaseConfigured() && session._supabaseId) {
          try {
            await closeSession(session._supabaseId, actual, expected, user?.id)
          } catch (err) {
            console.error('Failed to close session in Supabase:', err)
          }
        }

        return closed
      }
    }),
    {
      name: 'epos-cash-session',
    }
  )
)
