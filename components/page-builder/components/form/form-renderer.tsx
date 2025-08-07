'use client'

import { useState, useEffect } from 'react'
import { BaseComponentProps, getConfigValue } from '../types'
import { useEntity } from '@/hooks/use-entities'
import { useQueryExecution } from '@/hooks/use-query-execution'
import { useCreateEntityInstance, useUpdateEntityInstance, useEntityInstances } from '@/hooks/use-entity-instances'
import { PropertyInput } from '@/components/entity-instances/property-input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { EntityInstanceWithProperties } from '@/types/entity-instance'
import { Property } from '@/types/entity'
import { validateValue, castValue } from '@/lib/entity-instance-utils'
import { cn } from '@/lib/utils'

type FormType = 'create' | 'update'

export function FormRenderer({ 
  component, 
  pageParameters = {}, 
  projectId,
  isPreview,
  localConfigUpdates
}: BaseComponentProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [entityInstancesCache, setEntityInstancesCache] = useState<Record<string, EntityInstanceWithProperties[]>>({})
  
  // Get configuration (with local updates for immediate feedback)
  const formType = getConfigValue(component, 'formType', 'create', localConfigUpdates) as FormType
  const entityId = getConfigValue(component, 'entityId', undefined, localConfigUpdates)
  const queryId = getConfigValue(component, 'queryId', undefined, localConfigUpdates)
  const columns = parseInt(getConfigValue(component, 'columns', '1', localConfigUpdates) || '1')
  const submitButtonText = getConfigValue(component, 'submitButtonText', 
    formType === 'create' ? 'Create' : 'Update',
    localConfigUpdates
  )
  
  // Fetch entity
  const { data: entity } = useEntity(
    projectId,
    entityId || '',
    { enabled: !!entityId }
  )
  
  // For update forms, fetch the instance
  const { data: queryResult } = useQueryExecution(
    projectId,
    queryId || '',
    { 
      enabled: formType === 'update' && !!queryId,
      pageSize: 1
    }
  )
  
  const instance = queryResult?.instances[0]
  
  // Mutations
  const createInstance = useCreateEntityInstance(projectId, entityId || '')
  const updateInstance = useUpdateEntityInstance(projectId, entityId || '', instance?.id || '')
  
  // Get visible properties from form_properties configuration
  const visiblePropertyIds = component.form_properties
    ?.filter(fp => fp.visible)
    ?.sort((a, b) => a.sort_order - b.sort_order)
    ?.map(fp => fp.property_id) || []
  
  // Get properties to display
  const displayProperties = visiblePropertyIds.length > 0
    ? entity?.properties?.filter(p => visiblePropertyIds.includes(p.id)) || []
    : entity?.properties || []
  
  // For create forms, always include required properties
  const requiredProperties = entity?.properties?.filter(p => p.is_required) || []
  const finalProperties = formType === 'create'
    ? Array.from(new Set([...displayProperties, ...requiredProperties]))
    : displayProperties

  // Fetch entity instances for entity-type properties
  useEffect(() => {
    if (!entity?.properties) return

    const entityProperties = entity.properties.filter(
      p => p.property_type === 'entity' && p.referenced_entity_id
    )

    entityProperties.forEach(async (prop) => {
      if (prop.referenced_entity_id && !entityInstancesCache[prop.referenced_entity_id]) {
        try {
          const response = await fetch(
            `/api/projects/${projectId}/entities/${prop.referenced_entity_id}/instances?limit=100`
          )
          if (response.ok) {
            const data = await response.json()
            setEntityInstancesCache(prev => ({
              ...prev,
              [prop.referenced_entity_id!]: data.instances
            }))
          }
        } catch (error) {
          console.error('Failed to fetch entity instances:', error)
        }
      }
    })
  }, [entity?.properties, projectId, entityInstancesCache])
  
  // Initialize form values
  useEffect(() => {
    if (formType === 'create' && entity?.properties) {
      const defaults: Record<string, any> = {}
      entity.properties.forEach(prop => {
        if (prop.default_value !== null && prop.default_value !== undefined) {
          defaults[prop.property_name] = castValue(prop.default_value, prop.property_type)
        }
      })
      setFormValues(defaults)
    } else if (formType === 'update' && instance) {
      setFormValues(instance.properties)
    }
  }, [formType, entity, instance])
  
  const handleValueChange = (propertyName: string, value: any) => {
    setFormValues(prev => ({ ...prev, [propertyName]: value }))
    // Clear error when value changes
    if (errors[propertyName]) {
      setErrors(prev => ({ ...prev, [propertyName]: '' }))
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!entity) return
    
    // Validate
    const newErrors: Record<string, string> = {}
    
    finalProperties.forEach(prop => {
      const value = formValues[prop.property_name]
      const error = validateValue(value, prop, formType === 'create')
      if (error) {
        newErrors[prop.property_name] = error
      }
    })
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (formType === 'create') {
        await createInstance.mutateAsync({ properties: formValues })
        toast.success('Created successfully')
        // Reset form
        const defaults: Record<string, any> = {}
        entity.properties?.forEach(prop => {
          if (prop.default_value !== null && prop.default_value !== undefined) {
            defaults[prop.property_name] = castValue(prop.default_value, prop.property_type)
          }
        })
        setFormValues(defaults)
      } else {
        await updateInstance.mutateAsync({ properties: formValues })
        toast.success('Updated successfully')
      }
    } catch (error) {
      toast.error('Failed to submit form')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!entity) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        No entity selected
      </div>
    )
  }
  
  if (formType === 'update' && !instance) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        No data to update
      </div>
    )
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div 
        className={cn(
          "grid gap-4",
          columns === 2 && "md:grid-cols-2",
          columns === 3 && "md:grid-cols-3",
          columns === 4 && "md:grid-cols-4"
        )}
      >
        {finalProperties.map(property => {
          const entityInstances = property.referenced_entity_id
            ? entityInstancesCache[property.referenced_entity_id] || []
            : []
            
          return (
            <PropertyInput
              key={property.id}
              property={property}
              value={formValues[property.property_name]}
              onChange={(value) => handleValueChange(property.property_name, value)}
              error={errors[property.property_name]}
              entityInstances={entityInstances}
            />
          )
        })}
      </div>
      
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || (isPreview && !window.confirm('Submit form in preview mode?'))}
        >
          {isSubmitting ? 'Submitting...' : submitButtonText}
        </Button>
      </div>
    </form>
  )
}