'use client'

import { useQuery as useReactQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Query, CreateQueryData, UpdateQueryData, QueryWithDetails } from '@/types/query'
import { toast } from 'sonner'

export function useQueries(projectId: string) {
  return useReactQuery<Query[]>({
    queryKey: ['queries', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/queries`)
      if (!response.ok) throw new Error('Failed to fetch queries')
      return response.json()
    },
    enabled: !!projectId
  })
}

export function useQuery(projectId: string, queryId: string) {
  return useReactQuery<QueryWithDetails>({
    queryKey: ['query', projectId, queryId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/queries/${queryId}`)
      if (!response.ok) throw new Error('Failed to fetch query')
      return response.json()
    },
    enabled: !!projectId && !!queryId
  })
}

export function useCreateQuery(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateQueryData) => {
      const response = await fetch(`/api/projects/${projectId}/queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create query')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queries', projectId] })
      toast.success('Query created successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
}

export function useUpdateQuery(projectId: string, queryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateQueryData) => {
      const response = await fetch(`/api/projects/${projectId}/queries/${queryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update query')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queries', projectId] })
      queryClient.invalidateQueries({ queryKey: ['query', projectId, queryId] })
      toast.success('Query updated successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
}

export function useDeleteQuery(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (queryId: string) => {
      const response = await fetch(`/api/projects/${projectId}/queries/${queryId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete query')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queries', projectId] })
      toast.success('Query deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
}