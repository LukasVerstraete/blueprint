import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Container,
  ContainerWithChildren,
  CreateContainerInput,
  UpdateContainerInput
} from '@/types/page'

// Container queries
export function useContainers(projectId: string, pageId: string) {
  return useQuery({
    queryKey: ['containers', projectId, pageId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}/containers`)
      if (!response.ok) {
        throw new Error('Failed to fetch containers')
      }
      const data = await response.json()
      return data.containers as ContainerWithChildren[]
    },
    enabled: !!projectId && !!pageId
  })
}

// Container mutations
export function useCreateContainer(projectId: string, pageId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreateContainerInput) => {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}/containers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create container')
      }
      
      const data = await response.json()
      return data.container as Container
    },
    onSuccess: () => {
      // Only invalidate containers, not the page itself
      queryClient.invalidateQueries({ queryKey: ['containers', projectId, pageId] })
    }
  })
}

export function useUpdateContainer(projectId: string, pageId: string, containerId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: UpdateContainerInput) => {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}/containers/${containerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update container')
      }
      
      const data = await response.json()
      return data.container as Container
    },
    onSuccess: () => {
      // Only invalidate containers, not the page itself
      queryClient.invalidateQueries({ queryKey: ['containers', projectId, pageId] })
    }
  })
}

export function useDeleteContainer(projectId: string, pageId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (containerId: string) => {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}/containers/${containerId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete container')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      // Only invalidate containers, not the page itself
      queryClient.invalidateQueries({ queryKey: ['containers', projectId, pageId] })
    }
  })
}

// Helper to move container (update parent and sort order)
export function useMoveContainer(projectId: string, pageId: string, containerId: string) {
  const updateContainer = useUpdateContainer(projectId, pageId, containerId)
  
  return useMutation({
    mutationFn: async ({ parent_container_id, sort_order }: { parent_container_id?: string | null; sort_order?: number }) => {
      return updateContainer.mutateAsync({ parent_container_id, sort_order })
    }
  })
}

// Helper to update container layout settings
export function useUpdateContainerLayout(projectId: string, pageId: string, containerId: string) {
  const updateContainer = useUpdateContainer(projectId, pageId, containerId)
  
  return useMutation({
    mutationFn: async (layoutSettings: Partial<UpdateContainerInput>) => {
      return updateContainer.mutateAsync(layoutSettings)
    }
  })
}