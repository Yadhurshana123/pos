import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchInventory, adjustStock, transferStock, fetchMovements } from '@/services/inventory'

export function useInventory(siteId) {
  return useQuery({
    queryKey: ['inventory', siteId],
    queryFn: () => fetchInventory(siteId),
    staleTime: 15_000,
  })
}

export function useInventoryMovements(productId) {
  return useQuery({
    queryKey: ['inventory-movements', productId],
    queryFn: () => fetchMovements(productId),
    enabled: !!productId,
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useTransferStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: transferStock,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}
