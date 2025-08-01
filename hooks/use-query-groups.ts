'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateQueryGroupData, QueryGroup } from '@/types/query'
import { toast } from 'sonner'

export function useCreateQueryGroup(projectId: string, queryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateQueryGroupData) => {
      const response = await fetch(`/api/projects/${projectId}/queries/${queryId}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create query group')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['query', projectId, queryId] })
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
}

export function useUpdateQueryGroup(projectId: string, queryId: string, groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<QueryGroup>) => {
      const response = await fetch(`/api/projects/${projectId}/queries/${queryId}/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update query group')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['query', projectId, queryId] })
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
}

export function useDeleteQueryGroup(projectId: string, queryId: string, groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/queries/${queryId}/groups/${groupId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete query group')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['query', projectId, queryId] })
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
}