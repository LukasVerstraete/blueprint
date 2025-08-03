'use client'

import { useState, useRef } from 'react'
import { ContainerWithChildren } from '@/types/page'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { 
  MoreHorizontal, 
  Copy, 
  Trash2, 
  Plus,
  GripVertical
} from 'lucide-react'

interface CanvasContainerProps {
  container: ContainerWithChildren
  isSelected: boolean
  onSelect: (containerId: string) => void
  draggedContainerId: string | null
  pageId: string
  onUpdate?: (containerId: string, updates: any) => void
  onCreateChild?: () => void
  onDelete?: (containerId: string) => void
  selectedContainerId?: string | null
}

export function CanvasContainer({ 
  container, 
  isSelected, 
  onSelect,
  draggedContainerId,
  pageId,
  onUpdate,
  onCreateChild,
  onDelete,
  selectedContainerId
}: CanvasContainerProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this container? This will also delete all nested containers and components.')) {
      onDelete?.(container.id)
    }
  }

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent, direction: 'right' | 'bottom' | 'corner') => {
    e.stopPropagation()
    setIsResizing(true)
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height
    })
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y
      
      const updates: any = {}
      
      if (direction === 'right' || direction === 'corner') {
        const newWidth = Math.max(100, resizeStart.width + deltaX)
        updates.width = `${newWidth}px`
      }
      
      if (direction === 'bottom' || direction === 'corner') {
        const newHeight = Math.max(100, resizeStart.height + deltaY)
        updates.height = `${newHeight}px`
      }
      
      onUpdate?.(container.id, updates)
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedContainerId && draggedContainerId !== container.id) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    if (draggedContainerId && draggedContainerId !== container.id) {
      // TODO: Implement container move logic
    }
  }

  // Build container styles based on layout properties
  const containerStyles: React.CSSProperties = {
    backgroundColor: container.background_color || undefined,
    padding: container.padding ? `${container.padding}px` : undefined,
    gap: container.spacing ? `${container.spacing}px` : undefined,
    width: container.width || undefined,
    height: container.height || undefined,
    minHeight: container.min_height || '100px',
    position: 'relative'
  }

  if (container.layout_type === 'flex') {
    containerStyles.display = 'flex'
    containerStyles.flexDirection = container.flex_direction || 'row'
    containerStyles.justifyContent = container.flex_justify || 'flex-start'
    containerStyles.alignItems = container.flex_align || 'stretch'
  } else if (container.layout_type === 'grid') {
    containerStyles.display = 'grid'
    containerStyles.gridTemplateColumns = `repeat(${container.grid_columns || 2}, 1fr)`
  }

  const hasChildren = container.containers && container.containers.length > 0
  const hasComponents = container.components && container.components.length > 0
  const isEmpty = !hasChildren && !hasComponents

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative rounded-lg transition-all cursor-pointer",
        isSelected && "ring-2 ring-primary",
        isDragOver && "ring-2 ring-blue-500 bg-blue-50/50",
        isEmpty && "border-2 border-dashed border-muted",
        !isEmpty && "border border-border"
      )}
      style={containerStyles}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(container.id)
      }}
      onMouseDown={(e) => {
        // Prevent text selection while resizing
        if (isResizing) {
          e.preventDefault()
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Handle */}
      <div className="absolute -left-6 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="cursor-move p-1 hover:bg-accent rounded">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Container Actions */}
      <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="flex items-center gap-1 bg-background rounded-md shadow-sm border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Resize Handles */}
      {isSelected && (
        <>
          {/* Right resize handle */}
          <div 
            className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
          {/* Bottom resize handle */}
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 bg-primary rounded cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          />
          {/* Corner resize handle */}
          <div 
            className="absolute right-0 bottom-0 w-2 h-2 bg-primary rounded-br cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleResizeStart(e, 'corner')}
          />
        </>
      )}

      {/* Container Content */}
      {isEmpty ? (
        <div className="flex items-center justify-center min-h-[100px] text-muted-foreground">
          <div className="text-center">
            <p className="text-sm mb-2">Empty Container</p>
            <Button size="sm" variant="outline" onClick={(e) => {
              e.stopPropagation()
              onCreateChild?.()
            }}>
              <Plus className="h-3 w-3 mr-1" />
              Add Content
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Render child containers */}
          {container.containers && container.containers.map((childContainer) => (
            <CanvasContainer
              key={childContainer.id}
              container={childContainer}
              isSelected={selectedContainerId === childContainer.id}
              onSelect={onSelect}
              draggedContainerId={draggedContainerId}
              pageId={pageId}
              onUpdate={onUpdate}
              onCreateChild={onCreateChild}
              onDelete={onDelete}
              selectedContainerId={selectedContainerId}
            />
          ))}

          {/* Render components (placeholder for Phase 9) */}
          {container.components && container.components.map((component) => (
            <div
              key={component.id}
              className="p-4 bg-muted/50 rounded text-sm text-muted-foreground text-center"
            >
              {component.component_type} component
            </div>
          ))}
        </>
      )}
    </div>
  )
}