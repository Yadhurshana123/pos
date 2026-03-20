import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon } from '@/services/coupons'

export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: fetchCoupons,
    staleTime: 30_000,
  })
}

export function useCreateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCoupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  })
}

export function useUpdateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }) => updateCoupon(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  })
}

export function useDeleteCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  })
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({ code, cartTotal }) => validateCoupon(code, cartTotal),
  })
}
