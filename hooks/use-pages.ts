import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Page,
  PageWithChildren,
  PageParameter,
  CreatePageInput,
  UpdatePageInput,
  CreatePageParameterInput,
  UpdatePageParameterInput
} from '@/types/page'

// Page queries
export function usePages(projectId: string) {
  return useQuery({
    queryKey: ['pages', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/pages`)
      if (!response.ok) {
        throw new Error('Failed to fetch pages')
      }
      const data = await response.json()
      return data.pages as PageWithChildren[]
    },
    enabled: !!projectId
  })
}

export function usePage(projectId: string, pageId: string) {
  return useQuery({
    queryKey: ['pages', projectId, pageId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch page')
      }
      const data = await response.json()
      return data.page as PageWithChildren
    },
    enabled: !!projectId && !!pageId
  })
}

// Page mutations
export function useCreatePage(projectId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreatePageInput) => {
      const response = await fetch(`/api/projects/${projectId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create page')
      }
      
      const data = await response.json()
      return data.page as Page
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages', projectId] })
    }
  })
}

export function useUpdatePage(projectId: string, pageId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: UpdatePageInput) => {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update page')
      }
      
      const data = await response.json()
      return data.page as Page
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages', projectId] })
      queryClient.invalidateQueries({ queryKey: ['pages', projectId, pageId] })
    }
  })
}

export function useDeletePage(projectId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (pageId: string) => {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete page')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages', projectId] })
    }
  })
}

// Page parameter queries
export function usePageParameters(projectId: string, pageId: string) {
  return useQuery({
    queryKey: ['pages', projectId, pageId, 'parameters'],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}/parameters`)
      if (!response.ok) {
        throw new Error('Failed to fetch parameters')
      }
      const data = await response.json()
      return data.parameters as PageParameter[]
    },
    enabled: !!projectId && !!pageId
  })
}

// Page parameter mutations
export function useCreatePageParameter(projectId: string, pageId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreatePageParameterInput) => {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}/parameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create parameter')
      }
      
      const data = await response.json()
      return data.parameter as PageParameter
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages', projectId] })
      queryClient.invalidateQueries({ queryKey: ['pages', projectId, pageId] })
      queryClient.invalidateQueries({ queryKey: ['pages', projectId, pageId, 'parameters'] })
    }
  })
}

export function useUpdatePageParameter(projectId: string, pageId: string, parameterId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: UpdatePageParameterInput) => {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}/parameters/${parameterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update parameter')
      }
      
      const data = await response.json()
      return data.parameter as PageParameter
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages', projectId] })
      queryClient.invalidateQueries({ queryKey: ['pages', projectId, pageId] })
      queryClient.invalidateQueries({ queryKey: ['pages', projectId, pageId, 'parameters'] })
    }
  })
}

export function useDeletePageParameter(projectId: string, pageId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (parameterId: string) => {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}/parameters/${parameterId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete parameter')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages', projectId] })
      queryClient.invalidateQueries({ queryKey: ['pages', projectId, pageId] })
      queryClient.invalidateQueries({ queryKey: ['pages', projectId, pageId, 'parameters'] })
    }
  })
}