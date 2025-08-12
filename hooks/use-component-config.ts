import { useQuery } from '@tanstack/react-query'
import { ComponentConfig } from '@/types/page-builder'

export function useComponentConfig(componentId: string) {
  return useQuery({
    queryKey: ['component-config', componentId],
    queryFn: async () => {
      const response = await fetch(`/api/components/${componentId}/config`)
      if (!response.ok) {
        throw new Error('Failed to fetch component config')
      }
      const configs = await response.json() as ComponentConfig[]
      
      // Convert array of key-value pairs to object
      const configObject: Record<string, any> = {}
      configs.forEach(config => {
        configObject[config.key] = config.value
      })
      
      return configObject
    },
    enabled: !!componentId,
  })
}