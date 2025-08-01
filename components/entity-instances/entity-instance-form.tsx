'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PropertyInput } from './property-input'
import { useEntity } from '@/hooks/use-entities'
import { useCreateEntityInstance, useUpdateEntityInstance } from '@/hooks/use-entity-instances'
import { PropertyType } from '@/types/entity'
import { EntityInstanceWithProperties } from '@/types/entity-instance'
import { castValue, validateValue } from '@/lib/entity-instance-utils'

interface EntityInstanceFormProps {
  projectId: string
  entityId: string
  instanceId?: string
  instance?: EntityInstanceWithProperties
}

export function EntityInstanceForm({ 
  projectId, 
  entityId, 
  instanceId,
  instance
}: EntityInstanceFormProps) {
  const router = useRouter()
  const isEditMode = !!instanceId
  
  const { data: entity } = useEntity(projectId, entityId)
  const createMutation = useCreateEntityInstance(projectId, entityId)
  const updateMutation = useUpdateEntityInstance(projectId, entityId, instanceId || '')
  
  const [values, setValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [entityInstancesCache, setEntityInstancesCache] = useState<Record<string, EntityInstanceWithProperties[]>>({})

  // Initialize form values
  useEffect(() => {
    if (instance && isEditMode) {
      setValues(instance.properties)
    } else if (entity?.properties) {
      // Set default values for new instances
      const defaults: Record<string, any> = {}
      entity.properties.forEach(prop => {
        if (prop.default_value) {
          defaults[prop.property_name] = castValue(prop.default_value, prop.property_type)
        } else if (prop.is_list) {
          defaults[prop.property_name] = []
        }
      })
      setValues(defaults)
    }
  }, [instance, entity, isEditMode])

  // Fetch entity instances for entity-type properties
  useEffect(() => {
    if (!entity?.properties) return

    const entityProperties = entity.properties.filter(
      p => p.property_type === PropertyType.Entity && p.referenced_entity_id
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
  }, [entity?.properties, projectId])

  if (!entity) {
    return <div>Loading...</div>
  }

  const properties = entity.properties || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const newErrors: Record<string, string> = {}
    let isValid = true

    properties.forEach(property => {
      const value = values[property.property_name]
      const validation = validateValue(value, property.property_type, property.is_required, property.is_list)
      
      if (!validation.valid) {
        newErrors[property.property_name] = validation.error!
        isValid = false
      }
    })

    setErrors(newErrors)

    if (!isValid) {
      return
    }

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({ properties: values })
      } else {
        await createMutation.mutateAsync({ 
          entity_id: entityId,
          properties: values 
        })
      }
      
      router.push(`/projects/${projectId}/entities/${entityId}/instances`)
    } catch (error: any) {
      if (error.validation) {
        setErrors(error.validation)
      }
    }
  }

  const handleChange = (propertyName: string, value: any) => {
    setValues(prev => ({ ...prev, [propertyName]: value }))
    // Clear error when user changes value
    if (errors[propertyName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[propertyName]
        return newErrors
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit' : 'Create'} {entity.name}</CardTitle>
        <CardDescription>
          {isEditMode ? 'Update the information below' : 'Fill in the information below to create a new instance'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {properties.map(property => (
            <PropertyInput
              key={property.id}
              property={property}
              value={values[property.property_name]}
              onChange={(value) => handleChange(property.property_name, value)}
              error={errors[property.property_name]}
              entityInstances={
                property.referenced_entity_id 
                  ? entityInstancesCache[property.referenced_entity_id] || []
                  : []
              }
            />
          ))}

          <div className="flex gap-4">
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (isEditMode ? 'Update' : 'Create')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}/entities/${entityId}/instances`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}