'use client'

import { useState, useEffect } from 'react'
import { Property } from '@/types/entity'
import { TableColumn, TableColumnInput } from '@/types/page'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { GripVertical } from 'lucide-react'
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

interface TableColumnsManagerProps {
  properties: Property[]
  columns: TableColumn[]
  onChange: (columns: TableColumnInput[]) => void
}

interface ColumnItemProps {
  property: Property
  column?: TableColumn
  onChange: (visible: boolean) => void
}

function SortableColumnItem({ property, column, onChange }: ColumnItemProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-card rounded-lg border",
        isDragging && "opacity-50"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-move">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Checkbox
        id={property.id}
        checked={column?.visible ?? true}
        onCheckedChange={onChange}
      />
      <Label 
        htmlFor={property.id} 
        className="flex-1 cursor-pointer text-sm"
      >
        {property.name}
        <span className="text-xs text-muted-foreground ml-2">
          ({property.property_type})
        </span>
      </Label>
    </div>
  )
}

export function TableColumnsManager({ 
  properties, 
  columns, 
  onChange 
}: TableColumnsManagerProps) {
  const [localColumns, setLocalColumns] = useState<Map<string, TableColumnInput>>(new Map())
  const [propertyOrder, setPropertyOrder] = useState<string[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    // Initialize local state
    const columnMap = new Map<string, TableColumnInput>()
    const order: string[] = []

    // First add existing columns in their order
    const sortedColumns = [...columns].sort((a, b) => a.sort_order - b.sort_order)
    sortedColumns.forEach(col => {
      columnMap.set(col.property_id, {
        property_id: col.property_id,
        visible: col.visible,
        sort_order: col.sort_order
      })
      order.push(col.property_id)
    })

    // Then add any missing properties
    properties.forEach(prop => {
      if (!columnMap.has(prop.id)) {
        columnMap.set(prop.id, {
          property_id: prop.id,
          visible: false,
          sort_order: order.length
        })
        order.push(prop.id)
      }
    })

    setLocalColumns(columnMap)
    setPropertyOrder(order)
  }, [properties, columns])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = propertyOrder.indexOf(active.id as string)
      const newIndex = propertyOrder.indexOf(over?.id as string)

      const newOrder = arrayMove(propertyOrder, oldIndex, newIndex)
      setPropertyOrder(newOrder)

      // Update sort orders
      const updatedColumns = new Map(localColumns)
      newOrder.forEach((propId, index) => {
        const col = updatedColumns.get(propId)
        if (col) {
          updatedColumns.set(propId, { ...col, sort_order: index })
        }
      })
      setLocalColumns(updatedColumns)

      // Notify parent
      onChange(Array.from(updatedColumns.values()))
    }
  }

  const handleVisibilityChange = (propertyId: string, visible: boolean) => {
    const updatedColumns = new Map(localColumns)
    const col = updatedColumns.get(propertyId)
    if (col) {
      updatedColumns.set(propertyId, { ...col, visible })
    }
    setLocalColumns(updatedColumns)
    
    // Notify parent
    onChange(Array.from(updatedColumns.values()))
  }

  const toggleAll = (visible: boolean) => {
    const updatedColumns = new Map(localColumns)
    updatedColumns.forEach((col, key) => {
      updatedColumns.set(key, { ...col, visible })
    })
    setLocalColumns(updatedColumns)
    onChange(Array.from(updatedColumns.values()))
  }

  const orderedProperties = propertyOrder
    .map(id => properties.find(p => p.id === id))
    .filter(Boolean) as Property[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Table Columns</Label>
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
              const column = columns.find(c => c.property_id === property.id)
              const localCol = localColumns.get(property.id)
              
              return (
                <SortableColumnItem
                  key={property.id}
                  property={property}
                  column={column}
                  onChange={(visible) => handleVisibilityChange(property.id, visible)}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      <p className="text-xs text-muted-foreground">
        Drag to reorder columns. Check to show/hide columns in the table.
      </p>
    </div>
  )
}