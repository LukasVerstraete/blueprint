'use client'

import { useState, useEffect } from 'react'
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
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { Property, PropertyType, UpdatePropertyInput } from '@/types/entity'
import { PropertyDefaultInput } from './property-default-input'

interface PropertyTableProps {
  properties: Property[]
  onUpdate: (propertyId: string, data: UpdatePropertyInput) => void
  onDelete: (property: Property) => void
}

export function PropertyTable({ properties, onUpdate, onDelete }: PropertyTableProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, any>>({})

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

  const startEditing = (cellId: string, currentValue: any) => {
    setEditingCell(cellId)
    setEditValues({ [cellId]: currentValue })
  }

  const cancelEditing = () => {
    setEditingCell(null)
    setEditValues({})
  }

  const saveEdit = (propertyId: string, field: keyof UpdatePropertyInput) => {
    const value = editValues[`${propertyId}-${field}`]
    if (value !== undefined) {
      onUpdate(propertyId, { [field]: value })
    }
    cancelEditing()
  }

  const handleKeyDown = (e: React.KeyboardEvent, propertyId: string, field: keyof UpdatePropertyInput) => {
    if (e.key === 'Enter') {
      saveEdit(propertyId, field)
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
            const nameCell = `${property.id}-name`
            const requiredCell = `${property.id}-is_required`
            const defaultCell = `${property.id}-default_value`

            return (
              <TableRow key={property.id}>
                <TableCell 
                  className="font-medium cursor-pointer hover:bg-muted/50"
                  onClick={() => startEditing(nameCell, property.name)}
                >
                  {editingCell === nameCell ? (
                    <Input
                      value={editValues[nameCell] || ''}
                      onChange={(e) => setEditValues({ ...editValues, [nameCell]: e.target.value })}
                      onBlur={() => saveEdit(property.id, 'name')}
                      onKeyDown={(e) => handleKeyDown(e, property.id, 'name')}
                      autoFocus
                      className="h-8"
                    />
                  ) : (
                    property.name
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {property.property_name}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1">
                    {getPropertyTypeLabel(property.property_type)}
                    {property.is_list && (
                      <span className="text-xs text-muted-foreground">(List)</span>
                    )}
                  </span>
                </TableCell>
                <TableCell 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    onUpdate(property.id, { is_required: !property.is_required })
                  }}
                >
                  <Checkbox 
                    checked={property.is_required}
                    onCheckedChange={(checked) => {
                      onUpdate(property.id, { is_required: checked as boolean })
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => startEditing(defaultCell, property.default_value)}
                >
                  {editingCell === defaultCell ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <PropertyDefaultInput
                        type={property.property_type}
                        value={editValues[defaultCell]}
                        onChange={(value) => setEditValues({ ...editValues, [defaultCell]: value })}
                      />
                      <div className="flex gap-1 mt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => saveEdit(property.id, 'default_value')}
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
                    </div>
                  ) : (
                    property.default_value || (
                      <span className="text-muted-foreground">-</span>
                    )
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => onDelete(property)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}