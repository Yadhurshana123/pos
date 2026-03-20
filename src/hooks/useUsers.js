import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchProfiles, getProfile, updateProfile, createStaffMember, deactivateUser, activateUser } from '@/services/users'

export function useUsers(filters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => fetchProfiles(filters),
    staleTime: 30_000,
  })
}

export function useUser(userId) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => getProfile(userId),
    enabled: !!userId,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, updates }) => updateProfile(userId, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useCreateStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createStaffMember,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useActivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: activateUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
