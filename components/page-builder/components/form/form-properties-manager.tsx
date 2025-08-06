'use client'

import { useState, useEffect } from 'react'
import { Property } from '@/types/entity'
import { FormProperty, FormPropertyInput } from '@/types/page'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { GripVertical } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'

interface FormPropertiesManagerProps {
  properties: Property[]
  formProperties: FormProperty[]
  formType: 'create' | 'update'
  onChange: (properties: FormPropertyInput[]) => void
}

interface PropertyItemProps {
  property: Property
  formProperty?: FormProperty
  isRequired: boolean
  formType: 'create' | 'update'
  onChange: (visible: boolean) => void
}

function SortablePropertyItem({ property, formProperty, isRequired, formType, onChange }: PropertyItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: property.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // In create forms, required fields are always visible
  const isDisabled = formType === 'create' && isRequired

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-card rounded-lg border",
        isDragging && "opacity-50",
        isDisabled && "bg-muted/50"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-move">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Checkbox
        id={property.id}
        checked={isDisabled || formProperty?.visible || (formProperty === undefined && true)}
        onCheckedChange={onChange}
        disabled={isDisabled}
      />
      <Label 
        htmlFor={property.id} 
        className={cn(
          "flex-1 cursor-pointer text-sm",
          isDisabled && "text-muted-foreground"
        )}
      >
        {property.name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
        <span className="text-xs text-muted-foreground ml-2">
          ({property.property_type})
        </span>
      </Label>
    </div>
  )
}

export function FormPropertiesManager({ 
  properties, 
  formProperties, 
  formType,
  onChange 
}: FormPropertiesManagerProps) {
  const [localProperties, setLocalProperties] = useState<Map<string, FormPropertyInput>>(new Map())
  const [propertyOrder, setPropertyOrder] = useState<string[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    // Initialize local state
    const propMap = new Map<string, FormPropertyInput>()
    const order: string[] = []

    // First add existing form properties in their order
    const sortedFormProps = [...formProperties].sort((a, b) => a.sort_order - b.sort_order)
    sortedFormProps.forEach(fp => {
      propMap.set(fp.property_id, {
        property_id: fp.property_id,
        visible: fp.visible,
        sort_order: fp.sort_order
      })
      order.push(fp.property_id)
    })

    // Then add any missing properties
    properties.forEach(prop => {
      if (!propMap.has(prop.id)) {
        // New properties default to visible
        propMap.set(prop.id, {
          property_id: prop.id,
          visible: true,
          sort_order: order.length
        })
        order.push(prop.id)
      }
    })

    setLocalProperties(propMap)
    setPropertyOrder(order)
  }, [properties, formProperties])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = propertyOrder.indexOf(active.id as string)
      const newIndex = propertyOrder.indexOf(over?.id as string)

      const newOrder = arrayMove(propertyOrder, oldIndex, newIndex)
      setPropertyOrder(newOrder)

      // Update sort orders
      const updatedProps = new Map(localProperties)
      newOrder.forEach((propId, index) => {
        const prop = updatedProps.get(propId)
        if (prop) {
          updatedProps.set(propId, { ...prop, sort_order: index })
        }
      })
      setLocalProperties(updatedProps)

      // Notify parent
      onChange(Array.from(updatedProps.values()))
    }
  }

  const handleVisibilityChange = (propertyId: string, visible: boolean) => {
    const updatedProps = new Map(localProperties)
    const prop = updatedProps.get(propertyId)
    if (prop) {
      updatedProps.set(propertyId, { ...prop, visible })
    }
    setLocalProperties(updatedProps)
    
    // Notify parent
    onChange(Array.from(updatedProps.values()))
  }

  const toggleAll = (visible: boolean) => {
    const updatedProps = new Map(localProperties)
    updatedProps.forEach((prop, key) => {
      const property = properties.find(p => p.id === key)
      // Don't hide required fields in create forms
      if (!(formType === 'create' && property?.is_required)) {
        updatedProps.set(key, { ...prop, visible })
      }
    })
    setLocalProperties(updatedProps)
    onChange(Array.from(updatedProps.values()))
  }

  const orderedProperties = propertyOrder
    .map(id => properties.find(p => p.id === id))
    .filter(Boolean) as Property[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Form Fields</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => toggleAll(true)}
          >
            Show All
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => toggleAll(false)}
          >
            Hide All
          </Button>
        </div>
      </div>

      {formType === 'create' && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Required fields (marked with *) are always visible in create forms
          </AlertDescription>
        </Alert>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={propertyOrder}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {orderedProperties.map(property => {
              const formProperty = formProperties.find(fp => fp.property_id === property.id)
              const localProp = localProperties.get(property.id)
              
              return (
                <SortablePropertyItem
                  key={property.id}
                  property={property}
                  formProperty={formProperty}
                  isRequired={property.is_required || false}
                  formType={formType}
                  onChange={(visible) => handleVisibilityChange(property.id, visible)}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      <p className="text-xs text-muted-foreground">
        Drag to reorder fields. Check to show/hide fields in the form.
      </p>
    </div>
  )
}