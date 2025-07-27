import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserWithRole } from '@/types/user'
import { UserRole } from '@/types/project'
import { toast } from 'sonner'

export function useProjectUsers(projectId: string) {
  return useQuery<UserWithRole[]>({
    queryKey: ['projects', projectId, 'users'],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/users`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return response.json()
    },
    enabled: !!projectId
  })
}

export function useUpdateUserRole(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: UserRole }) => {
      const response = await fetch(`/api/projects/${projectId}/users`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, role })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user role')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'users'] })
      toast.success('User role updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}