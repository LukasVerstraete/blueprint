'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Property, EntityWithProperties } from '@/types/entity'
import { toast } from 'sonner'

export function useProperties(projectId: string, entityId: string) {
  return useQuery<Property[]>({
    queryKey: ['properties', projectId, entityId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/entities/${entityId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch entity properties')
      }
      const data = await response.json()
      const entity = data.entity as EntityWithProperties
      return entity.properties.filter(p => !p.is_deleted)
    },
    enabled: !!projectId && !!entityId
  })
}

export function useUpdateProperty(projectId: string, entityId: string, propertyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Property>) => {
      const response = await fetch(`/api/projects/${projectId}/entities/${entityId}/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update property')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', projectId, entityId] })
      queryClient.invalidateQueries({ queryKey: ['entities', projectId, entityId] })
      toast.success('Property updated successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
}

export function useDeleteProperty(projectId: string, entityId: string, propertyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/entities/${entityId}/properties/${propertyId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete property')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', projectId, entityId] })
      queryClient.invalidateQueries({ queryKey: ['entities', projectId, entityId] })
      toast.success('Property deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
}

export function useReorderProperties(projectId: string, entityId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (propertyIds: string[]) => {
      const response = await fetch(`/api/projects/${projectId}/entities/${entityId}/properties/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyIds })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reorder properties')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', projectId, entityId] })
      queryClient.invalidateQueries({ queryKey: ['entities', projectId, entityId] })
      toast.success('Properties reordered successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
}