'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ComponentType,
  CreateComponentInput,
  UpdateComponentInput,
  ComponentConfigInput,
  FormPropertyInput,
  TableColumnInput
} from '@/types/page'
import { toast } from 'sonner'

export function useCreateComponent(projectId: string, pageId: string, containerId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateComponentInput) => {
      const response = await fetch(
        `/api/projects/${projectId}/pages/${pageId}/containers/${containerId}/components`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create component')
      }

      const data = await response.json()
      return data.component
    },
    onSuccess: () => {
      // Only invalidate containers, not the page itself
      queryClient.invalidateQueries({ queryKey: ['containers', projectId, pageId] })
      toast.success('Component created successfully')
    },
    onError: (error) => {
      console.error('Create component error:', error)
      toast.error(error.message || 'Failed to create component')
    }
  })
}

export function useUpdateComponent(
  projectId: string, 
  pageId: string, 
  containerId: string,
  componentId: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateComponentInput) => {
      const response = await fetch(
        `/api/projects/${projectId}/pages/${pageId}/containers/${containerId}/components/${componentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update component')
      }

      const data = await response.json()
      return data.component
    },
    onSuccess: () => {
      // Only invalidate containers, not the page itself
      queryClient.invalidateQueries({ queryKey: ['containers', projectId, pageId] })
      toast.success('Component updated successfully')
    },
    onError: (error) => {
      console.error('Update component error:', error)
      toast.error(error.message || 'Failed to update component')
    }
  })
}

export function useDeleteComponent(
  projectId: string, 
  pageId: string, 
  containerId: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (componentId: string) => {
      const response = await fetch(
        `/api/projects/${projectId}/pages/${pageId}/containers/${containerId}/components/${componentId}`,
        {
          method: 'DELETE'
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete component')
      }

      return true
    },
    onSuccess: () => {
      // Only invalidate containers, not the page itself
      queryClient.invalidateQueries({ queryKey: ['containers', projectId, pageId] })
      toast.success('Component deleted successfully')
    },
    onError: (error) => {
      console.error('Delete component error:', error)
      toast.error(error.message || 'Failed to delete component')
    }
  })
}

export function useUpdateComponentConfig(
  projectId: string, 
  pageId: string, 
  containerId: string,
  componentId: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (config: ComponentConfigInput[]) => {
      const response = await fetch(
        `/api/projects/${projectId}/pages/${pageId}/containers/${containerId}/components/${componentId}/config`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update component configuration')
      }

      return true
    },
    onSuccess: () => {
      // Only invalidate containers, not the page itself
      queryClient.invalidateQueries({ queryKey: ['containers', projectId, pageId] })
      toast.success('Configuration updated successfully')
    },
    onError: (error) => {
      console.error('Update component config error:', error)
      toast.error(error.message || 'Failed to update configuration')
    }
  })
}

export function useUpdateFormProperties(
  projectId: string, 
  pageId: string, 
  containerId: string,
  componentId: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (properties: FormPropertyInput[]) => {
      const response = await fetch(
        `/api/projects/${projectId}/pages/${pageId}/containers/${containerId}/components/${componentId}/form-properties`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(properties)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update form properties')
      }

      return true
    },
    onSuccess: () => {
      // Only invalidate containers, not the page itself
      queryClient.invalidateQueries({ queryKey: ['containers', projectId, pageId] })
      toast.success('Form properties updated successfully')
    },
    onError: (error) => {
      console.error('Update form properties error:', error)
      toast.error(error.message || 'Failed to update form properties')
    }
  })
}

export function useUpdateTableColumns(
  projectId: string, 
  pageId: string, 
  containerId: string,
  componentId: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (columns: TableColumnInput[]) => {
      const response = await fetch(
        `/api/projects/${projectId}/pages/${pageId}/containers/${containerId}/components/${componentId}/table-columns`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(columns)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update table columns')
      }

      return true
    },
    onSuccess: () => {
      // Only invalidate containers, not the page itself
      queryClient.invalidateQueries({ queryKey: ['containers', projectId, pageId] })
      toast.success('Table columns updated successfully')
    },
    onError: (error) => {
      console.error('Update table columns error:', error)
      toast.error(error.message || 'Failed to update table columns')
    }
  })
}