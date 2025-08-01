'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Property, PropertyType } from '@/types/entity'
import { EntityInstanceWithProperties } from '@/types/entity-instance'
import { FormattedDateInput } from '@/components/properties/formatted-date-input'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PropertyInputProps {
  property: Property
  value: any
  onChange: (value: any) => void
  error?: string
  entityInstances?: EntityInstanceWithProperties[] // For entity type properties
}

export function PropertyInput({ 
  property, 
  value, 
  onChange, 
  error,
  entityInstances = []
}: PropertyInputProps) {
  // Handle list properties
  if (property.is_list) {
    return (
      <ListPropertyInput
        property={property}
        value={value || []}
        onChange={onChange}
        error={error}
        entityInstances={entityInstances}
      />
    )
  }

  // Single value properties
  return (
    <div className="space-y-2">
      <Label htmlFor={property.property_name}>
        {property.name}
        {property.is_required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <SinglePropertyInput
        property={property}
        value={value}
        onChange={onChange}
        entityInstances={entityInstances}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

function SinglePropertyInput({ 
  property, 
  value, 
  onChange,
  entityInstances
}: Omit<PropertyInputProps, 'error'>) {
  switch (property.property_type) {
    case PropertyType.String:
      return (
        <Input
          id={property.property_name}
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={property.default_value || undefined}
        />
      )

    case PropertyType.Number:
      return (
        <Input
          id={property.property_name}
          type="number"
          value={value || ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : parseFloat(e.target.value)
            onChange(val)
          }}
          placeholder={property.default_value || undefined}
        />
      )

    case PropertyType.Boolean:
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={property.property_name}
            checked={value === true}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <label
            htmlFor={property.property_name}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {property.name}
          </label>
        </div>
      )

    case PropertyType.Date:
      return (
        <FormattedDateInput
          type={PropertyType.Date}
          value={value}
          onChange={onChange}
        />
      )

    case PropertyType.DateTime:
      return (
        <FormattedDateInput
          type={PropertyType.DateTime}
          value={value}
          onChange={onChange}
        />
      )

    case PropertyType.Time:
      return (
        <FormattedDateInput
          type={PropertyType.Time}
          value={value}
          onChange={onChange}
        />
      )

    case PropertyType.Entity:
      return (
        <Select
          value={value || ''}
          onValueChange={(val) => onChange(val || null)}
        >
          <SelectTrigger className={cn(!value && "text-muted-foreground")}>
            <SelectValue placeholder="Please select an option" />
          </SelectTrigger>
          <SelectContent>
            {entityInstances.map((instance) => (
              <SelectItem key={instance.id} value={instance.id}>
                {instance._displayString || 'Unnamed'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    default:
      return null
  }
}

function ListPropertyInput({ 
  property, 
  value, 
  onChange, 
  error,
  entityInstances
}: PropertyInputProps) {
  const [items, setItems] = useState<any[]>(Array.isArray(value) ? value : [])

  useEffect(() => {
    onChange(items)
  }, [items, onChange])

  const addItem = () => {
    const defaultValue = property.property_type === PropertyType.Boolean ? false : ''
    setItems([...items, defaultValue])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, newValue: any) => {
    const newItems = [...items]
    newItems[index] = newValue
    setItems(newItems)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>
          {property.name}
          {property.is_required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
      
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items added</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <SinglePropertyInput
                  property={property}
                  value={item}
                  onChange={(val) => updateItem(index, val)}
                  entityInstances={entityInstances}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}