import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSettings, upsertSetting, deleteSetting } from '@/services/settings'

export function useSettings(venueId, siteId) {
  return useQuery({
    queryKey: ['settings', venueId, siteId],
    queryFn: () => fetchSettings(venueId, siteId),
    staleTime: 60_000,
  })
}

export function useUpsertSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value, venueId, siteId }) => upsertSetting(key, value, venueId, siteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

export function useDeleteSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, venueId, siteId }) => deleteSetting(key, venueId, siteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}
