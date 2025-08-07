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
  Trash2
} from 'lucide-react'
import { DeleteContainerDialog } from './delete-container-dialog'
import { DraggableContainer } from './draggable-container'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Resizable } from 're-resizable'
import { ComponentWrapper } from './components/component-wrapper'
import { getComponentByType } from './components/component-registry'
import { UnifiedElementToolbar } from './unified-element-toolbar'
// import { useCreateComponent, useUpdateComponent } from '@/hooks/use-components'
import { useProjectContext } from '@/app/providers/project-provider'

interface CanvasContainerProps {
  container: ContainerWithChildren
  isSelected: boolean
  onSelect: (containerId: string) => void
  pageId: string
  onUpdate?: (containerId: string, updates: any) => void
  onCreateChild?: (parentContainerId?: string) => void
  onDelete?: (containerId: string) => void
  selectedContainerId?: string | null
  activeId?: string | null
  overId?: string | null
  isPreview?: boolean
  selectedComponentId?: string | null
  onSelectComponent?: (componentId: string | null) => void
  pageParameters?: Record<string, any>
  onAddComponent?: (containerId: string, componentType: string) => void
  onDeleteComponent?: (containerId: string, componentId: string) => void
  onUpdateComponent?: (containerId: string, componentId: string, updates: any) => void
  onUpdateComponentConfig?: (componentId: string, config: any[]) => void
  onUpdateFormProperties?: (componentId: string, properties: any[]) => void
  onUpdateTableColumns?: (componentId: string, columns: any[]) => void
  componentConfigUpdates?: Record<string, any>
  formPropertiesUpdates?: Record<string, any>
  tableColumnsUpdates?: Record<string, any>
}

export function CanvasContainer({ 
  container, 
  isSelected, 
  onSelect,
  pageId,
  onUpdate,
  onCreateChild,
  onDelete,
  selectedContainerId,
  activeId,
  overId,
  isPreview = false,
  selectedComponentId,
  onSelectComponent,
  pageParameters = {},
  onAddComponent,
  onDeleteComponent,
  onUpdateComponent,
  onUpdateComponentConfig,
  onUpdateFormProperties,
  onUpdateTableColumns,
  componentConfigUpdates,
  formPropertiesUpdates,
  tableColumnsUpdates
}: CanvasContainerProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { currentProject } = useProjectContext()
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Check if this is the root container (no parent and sort_order 0)
  const isRootContainer = !container.parent_container_id && container.sort_order === 0
  
  // Make container droppable
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: container.id,
    data: {
      type: 'container',
      container
    }
  })

  const handleDelete = () => {
    onDelete?.(container.id)
  }

  const handleAddComponent = (componentType: any) => {
    onAddComponent?.(container.id, componentType)
  }

  // Handle resize
  const handleResize = (e: MouseEvent | TouchEvent, direction: string, ref: HTMLElement, delta: { width: number; height: number }) => {
    const updates: any = {}
    
    if (delta.width !== 0) {
      updates.width = `${ref.offsetWidth}px`
    }
    
    if (delta.height !== 0) {
      updates.height = `${ref.offsetHeight}px`
    }
    
    if (Object.keys(updates).length > 0) {
      onUpdate?.(container.id, updates)
    }
  }

  // Build container styles based on layout properties
  const containerStyles: React.CSSProperties = {
    backgroundColor: container.background_color || undefined,
    padding: container.padding ? `${container.padding}px` : undefined,
    gap: container.spacing ? `${container.spacing}px` : undefined,
    width: container.width || undefined,
    height: isRootContainer ? '100%' : (container.height || undefined),
    minHeight: isRootContainer ? '100%' : (container.min_height || '100px'),
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

  const isDragging = activeId === container.id
  const isDragOver = overId === container.id && activeId !== container.id

  const containerContent = (
    <div
      ref={(node) => {
        containerRef.current = node
        setDroppableRef(node)
      }}
      className={cn(
        "group relative transition-all cursor-pointer h-full",
        !isRootContainer && "rounded-lg",
        isSelected && !isRootContainer && "ring-2 ring-primary",
        isEmpty && !isRootContainer && "border-2 border-dashed border-muted",
        !isEmpty && !isRootContainer && "border border-border"
      )}
      style={containerStyles}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(container.id)
      }}
    >

      {/* Container Actions - Only show when selected and not root container */}
      {isSelected && !isRootContainer && (
        <div className="absolute -top-3 right-2 z-10">
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
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteDialog(true)
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
      


      {/* Container Content */}
      {isEmpty ? (
        <div className="flex items-center justify-center min-h-[100px] text-muted-foreground">
          {isSelected ? (
            <div className="text-center">
              <p className="text-sm mb-2">Drop elements here</p>
              <UnifiedElementToolbar 
                onSelect={(type) => {
                  if (type === 'container') {
                    onCreateChild?.()
                  } else {
                    onAddComponent?.(container.id, type)
                  }
                }}
                compact={true}
              />
            </div>
          ) : (
            <p className="text-sm">Empty Container</p>
          )}
        </div>
      ) : (
        <>
          {/* Combine all children (containers and components) into a single list */}
          {(() => {
            // Create a unified list of all children with their types
            const allChildren: Array<{ id: string; type: 'container' | 'component'; item: any }> = []
            
            // Add containers
            container.containers?.forEach(c => {
              allChildren.push({ id: c.id, type: 'container', item: c })
            })
            
            // Add components
            container.components?.forEach(c => {
              allChildren.push({ id: c.id, type: 'component', item: c })
            })
            
            // Sort by sort_order
            allChildren.sort((a, b) => (a.item.sort_order || 0) - (b.item.sort_order || 0))
            
            // If there are any children, wrap them in a SortableContext
            if (allChildren.length > 0) {
              return (
                <SortableContext 
                  items={allChildren.map(child => child.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {allChildren.map((child) => {
                    if (child.type === 'container') {
                      const childContainer = child.item
                      return (
                        <CanvasContainer
                          key={childContainer.id}
                          container={childContainer}
                          isSelected={selectedContainerId === childContainer.id}
                          onSelect={onSelect}
                          pageId={pageId}
                          onUpdate={onUpdate}
                          onCreateChild={() => onCreateChild?.(childContainer.id)}
                          onDelete={onDelete}
                          selectedContainerId={selectedContainerId}
                          activeId={activeId}
                          overId={overId}
                          isPreview={isPreview}
                          selectedComponentId={selectedComponentId}
                          onSelectComponent={onSelectComponent}
                          pageParameters={pageParameters}
                          onAddComponent={onAddComponent}
                          onDeleteComponent={onDeleteComponent}
                          onUpdateComponent={onUpdateComponent}
                          onUpdateComponentConfig={onUpdateComponentConfig}
                          onUpdateFormProperties={onUpdateFormProperties}
                          onUpdateTableColumns={onUpdateTableColumns}
                          componentConfigUpdates={componentConfigUpdates}
                          formPropertiesUpdates={formPropertiesUpdates}
                          tableColumnsUpdates={tableColumnsUpdates}
                        />
                      )
                    } else {
                      const component = child.item
                      const Component = getComponentByType(component.component_type)
                      if (!Component) return null

                      return (
                        <ComponentWrapper
                          key={component.id}
                          component={component}
                          isPreview={isPreview}
                          isSelected={selectedComponentId === component.id}
                          onSelect={() => onSelectComponent?.(component.id)}
                          onConfigure={() => onSelectComponent?.(component.id)}
                          onDelete={() => onDeleteComponent?.(container.id, component.id)}
                          projectId={currentProject?.id || ''}
                          pageId={pageId}
                          containerId={container.id}
                        >
                          <Component
                            component={component}
                            pageParameters={pageParameters}
                            isPreview={isPreview}
                            projectId={currentProject?.id || ''}
                            pageId={pageId}
                            containerId={container.id}
                            localConfigUpdates={componentConfigUpdates?.[component.id]}
                          />
                        </ComponentWrapper>
                      )
                    }
                  })}
                </SortableContext>
              )
            }
            
            return null
          })()}
        </>
      )}

      {/* Add Element button when selected */}
      {isSelected && !isEmpty && !isPreview && (
        <div className="mt-4 mb-2 flex justify-center">
          <UnifiedElementToolbar 
            onSelect={(type) => {
              if (type === 'container') {
                onCreateChild?.(container.id)
              } else {
                handleAddComponent(type)
              }
            }}
          />
        </div>
      )}

        {/* Delete Confirmation Dialog */}
        <DeleteContainerDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDelete}
        />
      </div>
  )

  // Root container should not be draggable
  if (isRootContainer) {
    return containerContent
  }

  return (
    <DraggableContainer
      id={container.id}
      isDragging={isDragging}
      isOver={isDragOver}
    >
      {isSelected ? (
        <Resizable
          size={{
            width: container.width || 'auto',
            height: container.height || 'auto'
          }}
          minWidth={100}
          minHeight={container.min_height || '100px'}
          onResize={handleResize}
          enable={{
            top: false,
            right: true,
            bottom: true,
            left: false,
            topRight: false,
            bottomRight: true,
            bottomLeft: false,
            topLeft: false
          }}
          handleStyles={{
            right: {
              width: '4px',
              right: '-2px',
              cursor: 'ew-resize',
              backgroundColor: 'transparent',
              transition: 'background-color 0.2s'
            },
            bottom: {
              height: '4px',
              bottom: '-2px',
              cursor: 'ns-resize',
              backgroundColor: 'transparent',
              transition: 'background-color 0.2s'
            },
            bottomRight: {
              width: '8px',
              height: '8px',
              right: '-2px',
              bottom: '-2px',
              cursor: 'nwse-resize',
              backgroundColor: 'transparent',
              transition: 'background-color 0.2s'
            }
          }}
          handleClasses={{
            right: 'hover:bg-primary/50',
            bottom: 'hover:bg-primary/50',
            bottomRight: 'hover:bg-primary/50'
          }}
        >
          {containerContent}
        </Resizable>
      ) : (
        containerContent
      )}
    </DraggableContainer>
  )
}