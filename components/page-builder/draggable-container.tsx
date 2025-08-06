'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ContainerWithChildren } from '@/types/page'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

interface DraggableContainerProps {
  id: string
  children: React.ReactNode
  isDragging?: boolean
  isOver?: boolean
}

export function DraggableContainer({ 
  id, 
  children,
  _isDragging,
  isOver
}: DraggableContainerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ 
    id,
    data: {
      type: 'container',
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isOver && "ring-2 ring-blue-500 bg-blue-50/20"
      )}
    >
      {/* Drag Handle */}
      <div
        className="absolute -left-6 top-2 opacity-0 hover:opacity-100 transition-opacity cursor-move z-10"
        {...attributes}
        {...listeners}
      >
        <div className="p-1 hover:bg-accent rounded">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      
      {children}
    </div>
  )
}

// Drag Overlay Component for smooth dragging
export function DragOverlayContainer({ container }: { container: ContainerWithChildren }) {
  return (
    <div className="bg-background border-2 border-primary rounded-lg shadow-lg opacity-90 p-4">
      <div className="text-sm font-medium">
        {container.layout_type} Container
      </div>
      {container.containers && container.containers.length > 0 && (
        <div className="text-xs text-muted-foreground mt-1">
          {container.containers.length} child container{container.containers.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}