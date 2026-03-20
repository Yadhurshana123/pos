import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDamageLostEntries, createDamageLostEntry, updateDamageLostEntry, deleteDamageLostEntry } from '@/services/damage-lost'

export function useDamageLostEntries(siteId, filters) {
  return useQuery({
    queryKey: ['damage-lost', siteId, filters],
    queryFn: () => fetchDamageLostEntries(siteId, filters),
    staleTime: 15_000,
  })
}

export function useCreateDamageLost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createDamageLostEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['damage-lost'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useUpdateDamageLost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }) => updateDamageLostEntry(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['damage-lost'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useDeleteDamageLost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteDamageLostEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['damage-lost'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}
