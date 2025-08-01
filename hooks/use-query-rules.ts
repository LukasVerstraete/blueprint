'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateQueryRuleData, QueryRule } from '@/types/query'
import { toast } from 'sonner'

export function useCreateQueryRule(projectId: string, queryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateQueryRuleData) => {
      const response = await fetch(`/api/projects/${projectId}/queries/${queryId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create query rule')
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

export function useUpdateQueryRule(projectId: string, queryId: string, ruleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<QueryRule>) => {
      const response = await fetch(`/api/projects/${projectId}/queries/${queryId}/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update query rule')
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

export function useDeleteQueryRule(projectId: string, queryId: string, ruleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/queries/${queryId}/rules/${ruleId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete query rule')
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