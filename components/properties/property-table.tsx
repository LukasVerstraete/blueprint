'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash2, Edit } from 'lucide-react'
import { Property, PropertyType, UpdatePropertyInput } from '@/types/entity'
import { PropertyDefaultInput } from './property-default-input'
import { PropertyValueDisplay } from './property-value-display'
import { PropertyInlineInput } from './property-inline-input'

interface PropertyTableProps {
  properties: Property[]
  onUpdate: (propertyId: string, data: UpdatePropertyInput) => Promise<void>
  onDelete: (property: Property) => void
}

export function PropertyTable({ properties, onUpdate, onDelete }: PropertyTableProps) {
  const [editingRow, setEditingRow] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, any>>({})
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, Partial<Property>>>({})

  if (properties.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <p className="text-muted-foreground">No properties yet. Add your first property to define the entity structure.</p>
      </div>
    )
  }

  const getPropertyTypeLabel = (type: PropertyType) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const startEditingRow = (property: Property) => {
    setEditingRow(property.id)
    setEditValues({
      [`${property.id}-name`]: property.name,
      [`${property.id}-is_required`]: property.is_required,
      [`${property.id}-default_value`]: property.default_value
    })
  }

  const cancelEditing = () => {
    setEditingRow(null)
    setEditValues({})
  }

  const saveEdit = async (propertyId: string) => {
    const updates: UpdatePropertyInput = {}
    const optimistic: Partial<Property> = {}
    
    const name = editValues[`${propertyId}-name`]
    if (name !== undefined) {
      updates.name = name
      optimistic.name = name
    }
    
    const isRequired = editValues[`${propertyId}-is_required`]
    if (isRequired !== undefined) {
      updates.is_required = isRequired
      optimistic.is_required = isRequired
    }
    
    const defaultValue = editValues[`${propertyId}-default_value`]
    if (defaultValue !== undefined) {
      updates.default_value = defaultValue
      optimistic.default_value = defaultValue
    }
    
    // Apply optimistic update
    setOptimisticUpdates(prev => ({ ...prev, [propertyId]: optimistic }))
    cancelEditing()
    
    // Call the update function
    try {
      await onUpdate(propertyId, updates)
    } finally {
      // Clear optimistic update after request completes
      setOptimisticUpdates(prev => {
        const newUpdates = { ...prev }
        delete newUpdates[propertyId]
        return newUpdates
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, propertyId: string) => {
    if (e.key === 'Enter') {
      saveEdit(propertyId)
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Property Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Required</TableHead>
            <TableHead>Default Value</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((property) => {
            const isEditing = editingRow === property.id
            const nameKey = `${property.id}-name`
            const requiredKey = `${property.id}-is_required`
            const defaultKey = `${property.id}-default_value`
            
            // Apply optimistic updates if any
            const displayProperty = optimisticUpdates[property.id] 
              ? { ...property, ...optimisticUpdates[property.id] }
              : property

            return (
              <TableRow key={property.id}>
                <TableCell className="font-medium">
                  {isEditing ? (
                    <PropertyInlineInput
                      type={PropertyType.String}
                      value={editValues[nameKey]}
                      onChange={(value) => setEditValues({ ...editValues, [nameKey]: value })}
                      onKeyDown={(e) => handleKeyDown(e, property.id)}
                      autoFocus
                    />
                  ) : (
                    displayProperty.name
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {displayProperty.property_name}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1">
                    {getPropertyTypeLabel(displayProperty.property_type)}
                    {displayProperty.is_list && (
                      <span className="text-xs text-muted-foreground">(List)</span>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <Checkbox 
                    checked={isEditing ? editValues[requiredKey] : displayProperty.is_required}
                    onCheckedChange={(checked) => {
                      if (isEditing) {
                        setEditValues({ ...editValues, [requiredKey]: checked })
                      }
                    }}
                    disabled={!isEditing}
                  />
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <PropertyDefaultInput
                      type={displayProperty.property_type}
                      value={editValues[defaultKey]}
                      onChange={(value) => setEditValues({ ...editValues, [defaultKey]: value })}
                    />
                  ) : (
                    <PropertyValueDisplay
                      type={displayProperty.property_type}
                      value={displayProperty.default_value}
                    />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {isEditing ? (
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        onClick={() => saveEdit(property.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditing}
                      >
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
                        <DropdownMenuItem onClick={() => startEditingRow(property)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(property)}
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
        </TableBody>
      </Table>
    </div>
  )
}