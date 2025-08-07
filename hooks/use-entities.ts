import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Entity, 
  EntityWithProperties, 
  CreateEntityInput, 
  UpdateEntityInput,
  Property,
  CreatePropertyInput,
  UpdatePropertyInput,
  ReorderPropertiesInput
} from '@/types/entity'

// Entity queries
export function useEntities(projectId: string) {
  return useQuery({
    queryKey: ['entities', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/entities`)
      if (!response.ok) {
        throw new Error('Failed to fetch entities')
      }
      const data = await response.json()
      return data.entities as (Entity & { property_count: number })[]
    },
    enabled: !!projectId
  })
}

export function useEntitiesWithProperties(projectId: string) {
  return useQuery({
    queryKey: ['entities-with-properties', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/entities/with-properties`)
      if (!response.ok) {
        throw new Error('Failed to fetch entities with properties')
      }
      const data = await response.json()
      return data.entities as EntityWithProperties[]
    },
    enabled: !!projectId
  })
}

export function useEntity(projectId: string, entityId: string) {
  return useQuery({
    queryKey: ['entities', projectId, entityId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/entities/${entityId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch entity')
      }
      const data = await response.json()
      return data.entity as EntityWithProperties
    },
    enabled: !!projectId && !!entityId
  })
}

// Entity mutations
export function useCreateEntity(projectId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreateEntityInput) => {
      const response = await fetch(`/api/projects/${projectId}/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create entity')
      }
      
      const data = await response.json()
      return data.entity as Entity
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', projectId] })
    }
  })
}

export function useUpdateEntity(projectId: string, entityId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: UpdateEntityInput) => {
      const response = await fetch(`/api/projects/${projectId}/entities/${entityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update entity')
      }
      
      const data = await response.json()
      return data.entity as Entity
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', projectId] })
      queryClient.invalidateQueries({ queryKey: ['entities', projectId, entityId] })
    }
  })
}

export function useDeleteEntity(projectId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (entityId: string) => {
      const response = await fetch(`/api/projects/${projectId}/entities/${entityId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete entity')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', projectId] })
    }
  })
}

// Property mutations
export function useCreateProperty(projectId: string, entityId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreatePropertyInput) => {
      const response = await fetch(`/api/projects/${projectId}/entities/${entityId}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create property')
      }
      
      const data = await response.json()
      return data.property as Property
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', projectId] })
      queryClient.invalidateQueries({ queryKey: ['entities', projectId, entityId] })
    }
  })
}

export function useUpdateProperty(projectId: string, entityId: string, propertyId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: UpdatePropertyInput) => {
      const response = await fetch(`/api/projects/${projectId}/entities/${entityId}/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update property')
      }
      
      const data = await response.json()
      return data.property as Property
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', projectId] })
      queryClient.invalidateQueries({ queryKey: ['entities', projectId, entityId] })
    }
  })
}

export function useDeleteProperty(projectId: string, entityId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await fetch(`/api/projects/${projectId}/entities/${entityId}/properties/${propertyId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete property')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', projectId] })
      queryClient.invalidateQueries({ queryKey: ['entities', projectId, entityId] })
    }
  })
}

export function useReorderProperties(projectId: string, entityId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: ReorderPropertiesInput) => {
      const response = await fetch(`/api/projects/${projectId}/entities/${entityId}/properties/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reorder properties')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', projectId, entityId] })
    }
  })
}