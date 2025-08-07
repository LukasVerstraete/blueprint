'use client'

import { useEffect, useState } from 'react'
import { BaseComponentProps, getConfigValue } from '../types'
import { useEntity } from '@/hooks/use-entities'
import { EntityInstanceWithProperties } from '@/types/entity-instance'
import { formatDisplayValue } from '@/lib/entity-instance-utils'
import { PropertyValueDisplay } from '@/components/properties/property-value-display'

export function PropertyRenderer({ 
  component, 
  pageParameters = {}, 
  projectId,
  localConfigUpdates
}: BaseComponentProps) {
  const [propertyValue, setPropertyValue] = useState<any>(null)
  const [propertyInfo, setPropertyInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Get configuration (with local updates for immediate feedback)
  const propertyId = getConfigValue(component, 'propertyId', undefined, localConfigUpdates)
  const entityId = getConfigValue(component, 'entityId', undefined, localConfigUpdates)
  const entityInstanceId = getConfigValue(component, 'entityInstanceId', undefined, localConfigUpdates)

  // Resolve entity instance ID from page parameters if needed
  const resolvedEntityInstanceId = entityInstanceId?.startsWith('param:') 
    ? pageParameters[entityInstanceId.replace('param:', '')] 
    : entityInstanceId

  // Fetch entity to get property details
  const { data: entity } = useEntity(
    projectId,
    entityId || '',
    { enabled: !!entityId && !!propertyId }
  )

  const property = entity?.properties?.find(p => p.id === propertyId)

  useEffect(() => {
    async function fetchPropertyValue() {
      if (!resolvedEntityInstanceId || !entityId || !property) {
        return
      }

      setIsLoading(true)
      try {
        // Fetch entity instance
        const response = await fetch(
          `/api/projects/${projectId}/entities/${entityId}/instances/${resolvedEntityInstanceId}`
        )
        if (response.ok) {
          const data = await response.json()
          const instance = data.instance as EntityInstanceWithProperties
          const value = instance.properties[property.property_name]
          setPropertyValue(value)
          setPropertyInfo(property)
        }
      } catch (error) {
        console.error('Error fetching property value:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPropertyValue()
  }, [resolvedEntityInstanceId, entityId, property, projectId])

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-muted rounded w-24"></div>
        <div className="h-6 bg-muted rounded w-32"></div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="text-sm text-muted-foreground">
        Property not configured
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-muted-foreground">
        {property.name}
      </div>
      <div className="text-sm">
        {propertyValue !== null && propertyValue !== undefined ? (
          <PropertyValueDisplay 
            value={propertyValue} 
            property={property}
          />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    </div>
  )
}