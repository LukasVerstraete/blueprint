'use client'

import { useEffect, useState } from 'react'
import { BaseComponentProps, getConfigValue } from '../types'
import { useEntity } from '@/hooks/use-entities'
import { useQueryExecution } from '@/hooks/use-query-execution'
import { EntityInstanceWithProperties } from '@/types/entity-instance'
import { resolveDisplayString } from '@/lib/display-string-utils'
import { formatDisplayValue } from '@/lib/entity-instance-utils'
import { cn } from '@/lib/utils'

type LabelType = 'static' | 'entity' | 'property' | 'query'

export function LabelRenderer({ 
  component, 
  pageParameters = {}, 
  projectId,
  localConfigUpdates
}: BaseComponentProps) {
  const [displayValue, setDisplayValue] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Get configuration (with local updates for immediate feedback)
  const type = getConfigValue(component, 'type', 'static', localConfigUpdates) as LabelType
  const text = getConfigValue(component, 'text', '', localConfigUpdates)
  const entityInstanceId = getConfigValue(component, 'entityInstanceId', undefined, localConfigUpdates)
  const propertyId = getConfigValue(component, 'propertyId', undefined, localConfigUpdates)
  const queryId = getConfigValue(component, 'queryId', undefined, localConfigUpdates)
  const entityId = getConfigValue(component, 'entityId', undefined, localConfigUpdates)

  // Resolve entity instance ID from page parameters if needed
  const resolvedEntityInstanceId = entityInstanceId?.startsWith('param:') 
    ? pageParameters[entityInstanceId.replace('param:', '')] 
    : entityInstanceId

  // Fetch entity for entity type labels
  const { data: entity } = useEntity(
    projectId,
    entityId || '',
    { enabled: type === 'entity' && !!entityId && !!resolvedEntityInstanceId }
  )

  // Execute query for query type labels
  const { data: queryResult, isLoading: queryLoading } = useQueryExecution(
    projectId,
    queryId || '',
    { 
      enabled: type === 'query' && !!queryId,
      pageSize: 1
    }
  )

  useEffect(() => {
    async function fetchDisplayValue() {
      switch (type) {
        case 'static':
          setDisplayValue(text)
          break

        case 'entity':
          if (resolvedEntityInstanceId && entity) {
            setIsLoading(true)
            try {
              // Fetch entity instance
              const response = await fetch(
                `/api/projects/${projectId}/entities/${entity.id}/instances/${resolvedEntityInstanceId}`
              )
              if (response.ok) {
                const data = await response.json()
                const instance = data.instance as EntityInstanceWithProperties
                const display = resolveDisplayString(entity.display_string, instance.properties)
                setDisplayValue(display)
              }
            } catch (error) {
              console.error('Error fetching entity instance:', error)
              setDisplayValue('Error loading data')
            } finally {
              setIsLoading(false)
            }
          }
          break

        case 'property':
          if (resolvedEntityInstanceId && propertyId && entityId) {
            setIsLoading(true)
            try {
              // Fetch entity to get property details
              const entityResponse = await fetch(
                `/api/projects/${projectId}/entities/${entityId}`
              )
              if (entityResponse.ok) {
                const entityData = await entityResponse.json()
                const property = entityData.entity.properties?.find((p: any) => p.id === propertyId)
                
                if (property) {
                  // Fetch entity instance
                  const instanceResponse = await fetch(
                    `/api/projects/${projectId}/entities/${entityId}/instances/${resolvedEntityInstanceId}`
                  )
                  if (instanceResponse.ok) {
                    const instanceData = await instanceResponse.json()
                    const instance = instanceData.instance as EntityInstanceWithProperties
                    const propValue = instance.properties[property.property_name]
                    const formatted = formatDisplayValue(propValue, property.property_type)
                    setDisplayValue(formatted)
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching property value:', error)
              setDisplayValue('Error loading data')
            } finally {
              setIsLoading(false)
            }
          }
          break

        case 'query':
          if (queryResult && queryResult.data && queryResult.data.length > 0) {
            // For now, just show the count or first result's display string
            setDisplayValue(`${queryResult.total} results`)
          } else if (!queryLoading && queryId) {
            setDisplayValue('No results')
          }
          break
      }
    }

    fetchDisplayValue()
  }, [type, text, resolvedEntityInstanceId, entity, propertyId, queryResult, queryLoading, projectId, entityId, queryId])

  if (isLoading || queryLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-32"></div>
      </div>
    )
  }

  return (
    <div className={cn("text-sm", type === 'static' && "whitespace-pre-wrap")}>
      {displayValue || <span className="text-muted-foreground">No content</span>}
    </div>
  )
}