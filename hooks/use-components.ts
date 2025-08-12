import { useQuery } from '@tanstack/react-query'
import { Component } from '@/types/page-builder'

export function useComponents(containerId: string) {
  return useQuery({
    queryKey: ['container-components', containerId],
    queryFn: async () => {
      const response = await fetch(`/api/containers/${containerId}/components`)
      if (!response.ok) {
        throw new Error('Failed to fetch components')
      }
      return response.json() as Promise<Component[]>
    },
    enabled: !!containerId,
  })
}