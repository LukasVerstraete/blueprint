import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  EntityInstanceWithProperties, 
  CreateEntityInstanceInput, 
  UpdateEntityInstanceInput 
} from '@/types/entity-instance'
import { toast } from 'sonner'

interface PaginatedResponse {
  instances: EntityInstanceWithProperties[]
  total: number
  page: number
  limit: number
}

interface UseEntityInstancesOptions {
  page?: number
  limit?: number
}

export function useEntityInstances(
  projectId: string, 
  entityId: string,
  options: UseEntityInstancesOptions = {}
) {
  const { page = 1, limit = 50 } = options

  return useQuery<PaginatedResponse>({
    queryKey: ['entity-instances', projectId, entityId, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      const response = await fetch(
        `/api/projects/${projectId}/entities/${entityId}/instances?${params}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch entity instances')
      }
      
      return response.json()
    },
    enabled: !!projectId && !!entityId
  })
}

export function useEntityInstance(
  projectId: string,
  entityId: string,
  instanceId: string
) {
  return useQuery<EntityInstanceWithProperties>({
    queryKey: ['entity-instance', projectId, entityId, instanceId],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${projectId}/entities/${entityId}/instances/${instanceId}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch entity instance')
      }
      
      return response.json()
    },
    enabled: !!projectId && !!entityId && !!instanceId
  })
}

export function useCreateEntityInstance(projectId: string, entityId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateEntityInstanceInput) => {
      const response = await fetch(
        `/api/projects/${projectId}/entities/${entityId}/instances`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        if (error.errors) {
          // Validation errors
          throw { validation: error.errors }
        }
        throw new Error(error.error || 'Failed to create entity instance')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate the instances list
      queryClient.invalidateQueries({ 
        queryKey: ['entity-instances', projectId, entityId] 
      })
      
      toast.success('Entity instance created successfully')
    },
    onError: (error: any) => {
      if (error.validation) {
        // Let the form handle validation errors
        return
      }
      
      toast.error(error.message || 'Failed to create entity instance')
    }
  })
}

export function useUpdateEntityInstance(
  projectId: string,
  entityId: string,
  instanceId: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateEntityInstanceInput) => {
      const response = await fetch(
        `/api/projects/${projectId}/entities/${entityId}/instances/${instanceId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        if (error.errors) {
          // Validation errors
          throw { validation: error.errors }
        }
        throw new Error(error.error || 'Failed to update entity instance')
      }

      return response.json()
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ['entity-instance', projectId, entityId, instanceId] 
      })

      // Snapshot the previous value
      const previousInstance = queryClient.getQueryData<EntityInstanceWithProperties>([
        'entity-instance', projectId, entityId, instanceId
      ])

      // Optimistically update
      if (previousInstance) {
        queryClient.setQueryData<EntityInstanceWithProperties>(
          ['entity-instance', projectId, entityId, instanceId],
          {
            ...previousInstance,
            properties: {
              ...previousInstance.properties,
              ...newData.properties
            }
          }
        )
      }

      return { previousInstance }
    },
    onError: (error: any, newData, context) => {
      // Rollback on error
      if (context?.previousInstance) {
        queryClient.setQueryData(
          ['entity-instance', projectId, entityId, instanceId],
          context.previousInstance
        )
      }

      if (error.validation) {
        // Let the form handle validation errors
        return
      }
      
      toast.error(error.message || 'Failed to update entity instance')
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ 
        queryKey: ['entity-instance', projectId, entityId, instanceId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['entity-instances', projectId, entityId] 
      })
      
      toast.success('Entity instance updated successfully')
    }
  })
}

export function useDeleteEntityInstance(projectId: string, entityId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (instanceId: string) => {
      const response = await fetch(
        `/api/projects/${projectId}/entities/${entityId}/instances/${instanceId}`,
        {
          method: 'DELETE'
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete entity instance')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate the instances list
      queryClient.invalidateQueries({ 
        queryKey: ['entity-instances', projectId, entityId] 
      })
      
      toast.success('Entity instance deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete entity instance')
    }
  })
}