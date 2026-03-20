import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchReturns, createReturn, approveReturn, rejectReturn } from '@/services/returns'

export function useReturns(filters) {
  return useQuery({
    queryKey: ['returns', filters],
    queryFn: () => fetchReturns(filters),
    staleTime: 15_000,
  })
}

export function useCreateReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createReturn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['returns'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useApproveReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: approveReturn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['returns'] }),
  })
}

export function useRejectReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: rejectReturn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['returns'] }),
  })
}
