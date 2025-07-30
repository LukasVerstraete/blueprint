'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { PropertyDefaultInput } from './property-default-input'
import { PropertyType, CreatePropertyInput, Entity } from '@/types/entity'
import { toCamelCase } from '@/lib/entity-utils'

interface PropertyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreatePropertyInput) => void
  isLoading?: boolean
  entities?: Entity[] // For entity type properties
}

export function PropertyForm({ open, onOpenChange, onSubmit, isLoading, entities = [] }: PropertyFormProps) {
  const [name, setName] = useState('')
  const [propertyType, setPropertyType] = useState<PropertyType>(PropertyType.String)
  const [isRequired, setIsRequired] = useState(false)
  const [isList, setIsList] = useState(false)
  const [defaultValue, setDefaultValue] = useState<string | null>(null)
  const [referencedEntityId, setReferencedEntityId] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; referencedEntityId?: string }>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validate
    const newErrors: typeof errors = {}
    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (propertyType === PropertyType.Entity && !referencedEntityId) {
      newErrors.referencedEntityId = 'Please select an entity'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({
      name: name.trim(),
      property_name: toCamelCase(name.trim()),
      property_type: propertyType,
      is_required: isRequired,
      is_list: isList,
      default_value: defaultValue,
      referenced_entity_id: propertyType === PropertyType.Entity ? referencedEntityId : null,
    })
  }

  const handleClose = () => {
    setName('')
    setPropertyType(PropertyType.String)
    setIsRequired(false)
    setIsList(false)
    setDefaultValue(null)
    setReferencedEntityId(null)
    setErrors({})
    onOpenChange(false)
  }

  const propertyTypeOptions = [
    { value: PropertyType.String, label: 'String' },
    { value: PropertyType.Number, label: 'Number' },
    { value: PropertyType.Boolean, label: 'Boolean' },
    { value: PropertyType.Date, label: 'Date' },
    { value: PropertyType.DateTime, label: 'Date & Time' },
    { value: PropertyType.Time, label: 'Time' },
    { value: PropertyType.Entity, label: 'Entity Reference' },
  ]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Property</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First Name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Will be converted to camelCase: {name ? toCamelCase(name) : 'firstName'}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={propertyType}
                onValueChange={(value) => {
                  setPropertyType(value as PropertyType)
                  setDefaultValue(null)
                  setReferencedEntityId(null)
                }}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {propertyType === PropertyType.Entity && (
              <div className="grid gap-2">
                <Label htmlFor="referencedEntity">Referenced Entity</Label>
                <Select
                  value={referencedEntityId || ''}
                  onValueChange={setReferencedEntityId}
                >
                  <SelectTrigger id="referencedEntity" className={errors.referencedEntityId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select an entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.referencedEntityId && (
                  <p className="text-sm text-destructive">{errors.referencedEntityId}</p>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={isRequired}
                onCheckedChange={(checked) => setIsRequired(checked as boolean)}
              />
              <Label
                htmlFor="required"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Required field
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="list"
                checked={isList}
                onCheckedChange={(checked) => setIsList(checked as boolean)}
              />
              <Label
                htmlFor="list"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Allow multiple values (List)
              </Label>
            </div>

            {propertyType !== PropertyType.Entity && (
              <div className="grid gap-2">
                <Label>Default Value (Optional)</Label>
                <PropertyDefaultInput
                  type={propertyType}
                  value={defaultValue}
                  onChange={setDefaultValue}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Property'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}