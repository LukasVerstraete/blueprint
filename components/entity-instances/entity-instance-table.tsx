'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormattedDateInput } from '@/components/properties/formatted-date-input'
import { useEntityInstances, useDeleteEntityInstance, useCreateEntityInstance } from '@/hooks/use-entity-instances'
import { useEntity } from '@/hooks/use-entities'
import { formatDisplayValue, validateValue, castValue } from '@/lib/entity-instance-utils'
import { resolveDisplayString } from '@/lib/display-string-utils'
import { MoreHorizontal, Trash2, Edit, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { DeleteEntityInstanceDialog } from './delete-entity-instance-dialog'
import { EntityInstanceWithProperties } from '@/types/entity-instance'
import { Property, PropertyType } from '@/types/entity'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function EntityInstanceTable() {
  const params = useParams()
  const projectId = params.id as string
  const entityId = params.entityId as string
  
  const [page, setPage] = useState(1)
  const [deleteInstance, setDeleteInstance] = useState<EntityInstanceWithProperties | null>(null)
  const [editingRow, setEditingRow] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, any>>({})
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, Partial<EntityInstanceWithProperties>>>({})
  const [entityInstancesCache, setEntityInstancesCache] = useState<Record<string, EntityInstanceWithProperties[]>>({})
  const [isCreating, setIsCreating] = useState(false)
  const [createValues, setCreateValues] = useState<Record<string, any>>({})
  
  const { data: entity } = useEntity(projectId, entityId)
  const { data: instanceData, isLoading, refetch } = useEntityInstances(projectId, entityId, { page })
  const deleteInstanceMutation = useDeleteEntityInstance(projectId, entityId)
  const createInstanceMutation = useCreateEntityInstance(projectId, entityId)

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
  }, [entity?.properties, projectId, entityInstancesCache])

  // Initialize create form with default values
  useEffect(() => {
    if (isCreating && entity?.properties) {
      const defaults: Record<string, any> = {}
      entity.properties.forEach(prop => {
        if (prop.default_value) {
          defaults[prop.property_name] = castValue(prop.default_value, prop.property_type)
        } else if (prop.is_list) {
          defaults[prop.property_name] = []
        }
      })
      setCreateValues(defaults)
    }
  }, [isCreating, entity])

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>
  }

  if (!instanceData || !entity) {
    return <div className="text-center py-4">No data available</div>
  }

  const { instances, total, limit } = instanceData
  const properties = entity.properties || []
  const totalPages = Math.ceil(total / limit)

  // Filter properties to show in table (non-list properties)
  const tableProperties = properties.filter(p => !p.is_list && !p.is_deleted)

  const handleDelete = async () => {
    if (deleteInstance) {
      await deleteInstanceMutation.mutateAsync(deleteInstance.id)
      setDeleteInstance(null)
    }
  }

  const startEditingRow = (instance: EntityInstanceWithProperties) => {
    setEditingRow(instance.id)
    const values: Record<string, any> = {}
    tableProperties.forEach(prop => {
      values[`${instance.id}-${prop.property_name}`] = instance.properties[prop.property_name]
    })
    setEditValues(values)
  }

  // Helper function to get current property values for an instance
  const getCurrentPropertyValues = (instanceId: string) => {
    const instance = instances.find(i => i.id === instanceId)
    if (!instance) return {}
    
    const currentValues = { ...instance.properties }
    
    // Apply edit values if this instance is being edited
    if (editingRow === instanceId) {
      tableProperties.forEach(prop => {
        const key = `${instanceId}-${prop.property_name}`
        if (key in editValues) {
          currentValues[prop.property_name] = editValues[key]
        }
      })
    }
    
    return currentValues
  }

  // Calculate display string for an instance (considering edit values)
  const getDisplayString = (instance: EntityInstanceWithProperties) => {
    if (editingRow === instance.id) {
      const currentValues = getCurrentPropertyValues(instance.id)
      const tempInstance = { ...instance, properties: currentValues }
      return resolveDisplayString(tempInstance, properties, entity.display_string)
    }
    
    // Apply optimistic updates if any
    if (optimisticUpdates[instance.id]) {
      return optimisticUpdates[instance.id]._displayString || instance._displayString || 'Unnamed'
    }
    
    return instance._displayString || 'Unnamed'
  }

  const cancelEditing = () => {
    setEditingRow(null)
    setEditValues({})
  }

  const saveEdit = async (instanceId: string) => {
    const updates: Record<string, any> = {}
    const optimistic: Record<string, any> = {}
    
    // Find the current instance
    const instance = instances.find(i => i.id === instanceId)
    if (!instance) return

    // Collect all property updates
    tableProperties.forEach(prop => {
      const key = `${instanceId}-${prop.property_name}`
      if (key in editValues) {
        updates[prop.property_name] = editValues[key]
        optimistic[prop.property_name] = editValues[key]
      }
    })

    // Include all properties (not just table properties) for the update
    const allUpdates = { ...instance.properties, ...updates }

    // Validate all values
    for (const prop of tableProperties) {
      const value = updates[prop.property_name] ?? instance.properties[prop.property_name]
      const validation = validateValue(value, prop.property_type, prop.is_required, prop.is_list)
      if (!validation.valid) {
        toast.error(`${prop.name}: ${validation.error}`)
        return
      }
    }
    
    // Calculate the new display string
    const updatedInstance = { ...instance, properties: allUpdates }
    const newDisplayString = resolveDisplayString(updatedInstance, properties, entity.display_string)
    
    // Apply optimistic update with new display string
    setOptimisticUpdates(prev => ({ 
      ...prev, 
      [instanceId]: { 
        properties: allUpdates,
        _displayString: newDisplayString
      } 
    }))
    cancelEditing()
    
    try {
      // Use fetch directly for the update
      const response = await fetch(
        `/api/projects/${projectId}/entities/${entityId}/instances/${instanceId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            properties: allUpdates
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update')
      }

      // Refetch the data to get the updated instance
      await refetch()
      
      // Clear optimistic update after success
      setOptimisticUpdates(prev => {
        const newUpdates = { ...prev }
        delete newUpdates[instanceId]
        return newUpdates
      })
    } catch (error) {
      // Clear optimistic update on error
      setOptimisticUpdates(prev => {
        const newUpdates = { ...prev }
        delete newUpdates[instanceId]
        return newUpdates
      })
      toast.error(error instanceof Error ? error.message : 'Failed to update instance')
    }
  }

  const cancelCreate = () => {
    setIsCreating(false)
    setCreateValues({})
  }

  const saveCreate = async () => {
    // Validate all required fields
    for (const prop of properties) {
      const value = createValues[prop.property_name]
      const validation = validateValue(value, prop.property_type, prop.is_required, prop.is_list)
      if (!validation.valid) {
        toast.error(`${prop.name}: ${validation.error}`)
        return
      }
    }

    try {
      await createInstanceMutation.mutateAsync({
        entity_id: entityId,
        properties: createValues
      })
      cancelCreate()
    } catch {
      // Error is handled by the mutation
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, instanceId?: string) => {
    if (e.key === 'Enter') {
      if (instanceId) {
        saveEdit(instanceId)
      } else if (isCreating) {
        saveCreate()
      }
    } else if (e.key === 'Escape') {
      if (instanceId) {
        cancelEditing()
      } else if (isCreating) {
        cancelCreate()
      }
    }
  }

  const renderCell = (instance: EntityInstanceWithProperties | null, property: Property) => {
    const isEditing = instance && editingRow === instance.id
    const isNew = !instance && isCreating
    
    if (!isEditing && !isNew) {
      return instance ? formatDisplayValue(instance.properties[property.property_name], property.property_type) || '-' : ''
    }

    const value = instance 
      ? editValues[`${instance.id}-${property.property_name}`]
      : createValues[property.property_name]
    
    const onChange = (newValue: any) => {
      if (instance) {
        setEditValues(prev => ({ ...prev, [`${instance.id}-${property.property_name}`]: newValue }))
      } else {
        setCreateValues(prev => ({ ...prev, [property.property_name]: newValue }))
      }
    }

    switch (property.property_type) {
      case PropertyType.String:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, instance?.id)}
            className="h-8"
            autoFocus={property === tableProperties[0]}
          />
        )
      
      case PropertyType.Number:
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
            onKeyDown={(e) => handleKeyDown(e, instance?.id)}
            className="h-8"
          />
        )
      
      case PropertyType.Boolean:
        return (
          <Checkbox
            checked={value === true}
            onCheckedChange={onChange}
          />
        )
      
      case PropertyType.Date:
        return (
          <FormattedDateInput
            type={PropertyType.Date}
            value={value}
            onChange={onChange}
            onKeyDown={(e) => handleKeyDown(e, instance?.id)}
            className="h-8"
          />
        )
      
      case PropertyType.DateTime:
        return (
          <FormattedDateInput
            type={PropertyType.DateTime}
            value={value}
            onChange={onChange}
            onKeyDown={(e) => handleKeyDown(e, instance?.id)}
            className="h-8"
          />
        )
      
      case PropertyType.Time:
        return (
          <FormattedDateInput
            type={PropertyType.Time}
            value={value}
            onChange={onChange}
            onKeyDown={(e) => handleKeyDown(e, instance?.id)}
            className="h-8"
          />
        )
      
      case PropertyType.Entity:
        const entityInstances = property.referenced_entity_id 
          ? entityInstancesCache[property.referenced_entity_id] || []
          : []
        
        return (
          <Select value={value || ''} onValueChange={(val) => onChange(val || null)}>
            <SelectTrigger className={cn("h-8", !value && "text-muted-foreground")}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {entityInstances.map((entityInstance) => (
                <SelectItem key={entityInstance.id} value={entityInstance.id}>
                  {entityInstance._displayString || 'Unnamed'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      default:
        return null
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {total} total {entity.name.toLowerCase()} instances
        </p>
        {!isCreating && !editingRow && (
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add {entity.name}
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{entity.name}</TableHead>
              {tableProperties.map(property => (
                <TableHead key={property.id}>{property.name}</TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instances.map((instance) => {
              const isEditing = editingRow === instance.id
              // Apply optimistic updates if any
              const displayInstance = optimisticUpdates[instance.id] 
                ? { ...instance, ...optimisticUpdates[instance.id] }
                : instance

              return (
                <TableRow key={instance.id}>
                  <TableCell className="font-medium">
                    {getDisplayString(instance)}
                  </TableCell>
                  {tableProperties.map(property => (
                    <TableCell key={property.id}>
                      {renderCell(displayInstance, property)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" onClick={() => saveEdit(instance.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditing}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEditingRow(instance)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteInstance(instance)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            
            {isCreating && (
              <TableRow>
                <TableCell className="font-medium">
                  <span className="text-muted-foreground">New {entity.name}</span>
                </TableCell>
                {tableProperties.map(property => (
                  <TableCell key={property.id}>
                    {renderCell(null, property)}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" onClick={saveCreate}>
                      Create
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelCreate}>
                      Cancel
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <DeleteEntityInstanceDialog
        instance={deleteInstance}
        entity={entity}
        onClose={() => setDeleteInstance(null)}
        onConfirm={handleDelete}
        open={!!deleteInstance}
      />
    </>
  )
}