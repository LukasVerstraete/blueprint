'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

interface DraggableComponentProps {
  id: string
  children: React.ReactNode
  isPreview?: boolean
}

export function DraggableComponent({ 
  id, 
  children,
  isPreview = false
}: DraggableComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    data: {
      type: 'component',
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (isPreview) {
    return <>{children}</>
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative"
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