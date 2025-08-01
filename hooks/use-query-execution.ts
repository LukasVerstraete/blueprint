'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { QueryResult, QueryGroupWithRules } from '@/types/query'

interface UseQueryExecutionOptions {
  page?: number
  pageSize?: number
  enabled?: boolean
  groups?: QueryGroupWithRules[]
}

export function useQueryExecution(
  projectId: string,
  queryId: string,
  options: UseQueryExecutionOptions = {}
) {
  const { page = 1, pageSize = 50, enabled = true, groups } = options

  return useQuery<QueryResult>({
    queryKey: ['query-execution', projectId, queryId, page, pageSize, groups],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/queries/${queryId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, pageSize, groups })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to execute query')
      }
      return response.json()
    },
    enabled: enabled && !!projectId && !!queryId,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
  })
}