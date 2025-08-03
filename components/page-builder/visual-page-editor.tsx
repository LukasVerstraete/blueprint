'use client'

import { useState, useRef, useEffect } from 'react'
import { ContainerWithChildren, Container, LayoutType, FlexDirection, FlexJustify, FlexAlign, CreateContainerInput } from '@/types/page'
import { ContainerPropertiesPanel } from './container-properties-panel'
import { CanvasContainer } from './canvas-container'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Plus,
  Undo2,
  Redo2,
  Save,
  Grid3X3,
  Columns,
  Square,
  Layers,
  ArrowLeft,
  Settings,
  Eye
} from 'lucide-react'
import { useCreateContainer } from '@/hooks/use-containers'
import { useProjectContext } from '@/app/providers/project-provider'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface VisualPageEditorProps {
  pageId: string
  containers: ContainerWithChildren[]
  onRefresh?: () => void
  onSave?: () => void
  pageTitle?: string
  projectId?: string
}

interface HistoryState {
  containers: ContainerWithChildren[]
}

export function VisualPageEditor({ pageId, containers, onRefresh, onSave: _onSave, pageTitle, projectId }: VisualPageEditorProps) {
  const router = useRouter()
  const { currentProject } = useProjectContext()
  const createContainerMutation = useCreateContainer(currentProject?.id || '', pageId)
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null)
  const [draggedContainerId, setDraggedContainerId] = useState<string | null>(null)
  const [localContainers, setLocalContainers] = useState(containers)
  const [history, setHistory] = useState<HistoryState[]>([{ containers }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [deletedContainerIds, setDeletedContainerIds] = useState<string[]>([])
  const canvasRef = useRef<HTMLDivElement>(null)

  // Update local containers when props change
  useEffect(() => {
    setLocalContainers(containers)
    // Only reset history if containers changed externally (not from undo/redo)
    const isFromHistory = history[historyIndex]?.containers === containers
    if (!isFromHistory) {
      setHistory([{ containers }])
      setHistoryIndex(0)
    }
  }, [containers])

  const addToHistory = (newContainers: ContainerWithChildren[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ containers: newContainers })
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setLocalContainers(newContainers)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setLocalContainers(history[newIndex].containers)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setLocalContainers(history[newIndex].containers)
    }
  }

  // Handle refresh with history tracking
  // Update container locally
  const updateContainerLocally = (containerId: string, updates: Partial<Container>) => {
    const updateContainerRecursive = (items: ContainerWithChildren[]): ContainerWithChildren[] => {
      return items.map(item => {
        if (item.id === containerId) {
          return { ...item, ...updates }
        }
        if (item.containers) {
          return { ...item, containers: updateContainerRecursive(item.containers) }
        }
        return item
      })
    }
    
    const newContainers = updateContainerRecursive(localContainers)
    addToHistory(newContainers)
  }

  // Delete container locally
  const deleteContainerLocally = (containerId: string) => {
    // Track deleted containers
    const getAllChildIds = (containerId: string): string[] => {
      const ids: string[] = [containerId]
      const findContainer = (items: ContainerWithChildren[]): ContainerWithChildren | null => {
        for (const item of items) {
          if (item.id === containerId) return item
          if (item.containers) {
            const found = findContainer(item.containers)
            if (found) return found
          }
        }
        return null
      }
      
      const container = findContainer(localContainers)
      if (container?.containers) {
        container.containers.forEach(child => {
          ids.push(...getAllChildIds(child.id))
        })
      }
      
      return ids
    }
    
    // Add container and all its children to deleted list
    setDeletedContainerIds(prev => [...prev, ...getAllChildIds(containerId)])
    
    const deleteContainerRecursive = (items: ContainerWithChildren[]): ContainerWithChildren[] => {
      return items.filter(item => {
        if (item.id === containerId) {
          return false
        }
        if (item.containers) {
          item.containers = deleteContainerRecursive(item.containers)
        }
        return true
      })
    }
    
    const newContainers = deleteContainerRecursive(localContainers)
    addToHistory(newContainers)
    
    // Clear selection if deleted container was selected
    if (selectedContainerId === containerId) {
      setSelectedContainerId(null)
    }
  }

  // Create new container with defaults
  const handleCreateContainer = async (parentContainerId: string | null = null) => {
    const newContainer: CreateContainerInput = {
      page_id: pageId,
      parent_container_id: parentContainerId,
      layout_type: LayoutType.Flex,
      flex_direction: FlexDirection.Column,
      flex_justify: FlexJustify.Start,
      flex_align: FlexAlign.Stretch,
      spacing: 16,
      padding: 16,
      min_height: '100px',
      sort_order: localContainers.length
    }
    
    try {
      const result = await createContainerMutation.mutateAsync(newContainer)
      
      // Add to local state
      const newContainerWithChildren: ContainerWithChildren = {
        ...result,
        containers: [],
        components: []
      }
      
      if (parentContainerId) {
        // Add as child
        const addChildContainer = (items: ContainerWithChildren[]): ContainerWithChildren[] => {
          return items.map(item => {
            if (item.id === parentContainerId) {
              return {
                ...item,
                containers: [...(item.containers || []), newContainerWithChildren]
              }
            }
            if (item.containers) {
              return { ...item, containers: addChildContainer(item.containers) }
            }
            return item
          })
        }
        const newContainers = addChildContainer(localContainers)
        addToHistory(newContainers)
      } else {
        // Add as root
        const newContainers = [...localContainers, newContainerWithChildren]
        addToHistory(newContainers)
      }
      
      // Select the new container
      setSelectedContainerId(result.id)
      toast.success('Container created')
    } catch {
      toast.error('Failed to create container')
    }
  }

  // Save all changes
  const handleSaveChanges = async () => {
    try {
      // Delete containers that were removed
      if (deletedContainerIds.length > 0) {
        await Promise.all(
          deletedContainerIds.map(async (containerId) => {
            const response = await fetch(`/api/projects/${currentProject?.id}/pages/${pageId}/containers/${containerId}`, {
              method: 'DELETE'
            })
            if (!response.ok) {
              console.error(`Failed to delete container ${containerId}`)
            }
          })
        )
      }
      
      // Get all containers with their updates
      const getAllContainers = (items: ContainerWithChildren[]): Container[] => {
        const result: Container[] = []
        items.forEach(item => {
          const { containers: _containers, components: _components, ...container } = item
          result.push(container)
          if (item.containers) {
            result.push(...getAllContainers(item.containers))
          }
        })
        return result
      }
      
      const allContainers = getAllContainers(localContainers)
      
      // Update all containers
      await Promise.all(
        allContainers.map(async (container) => {
          const response = await fetch(`/api/projects/${currentProject?.id}/pages/${pageId}/containers/${container.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              parent_container_id: container.parent_container_id,
              layout_type: container.layout_type,
              flex_direction: container.flex_direction,
              flex_justify: container.flex_justify,
              flex_align: container.flex_align,
              grid_columns: container.grid_columns,
              spacing: container.spacing,
              padding: container.padding,
              background_color: container.background_color,
              width: container.width,
              height: container.height,
              min_height: container.min_height,
              sort_order: container.sort_order
            })
          })
          
          if (!response.ok) {
            console.error(`Failed to update container ${container.id}`)
          }
        })
      )
      
      // Clear deleted containers list after successful save
      setDeletedContainerIds([])
      
      toast.success('Changes saved successfully')
      onRefresh?.()
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save changes')
    }
  }

  const currentContainers = localContainers

  // Find selected container
  const findContainer = (containers: ContainerWithChildren[], id: string): ContainerWithChildren | null => {
    for (const container of containers) {
      if (container.id === id) return container
      if (container.containers) {
        const found = findContainer(container.containers, id)
        if (found) return found
      }
    }
    return null
  }

  const selectedContainer = selectedContainerId ? findContainer(currentContainers, selectedContainerId) : null

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/pages`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pages
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{pageTitle}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Page Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b px-4 py-2 flex items-center justify-between bg-background">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" onClick={() => handleCreateContainer()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Container
          </Button>
          
          <div className="border-l pl-2 ml-2 flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleUndo}
              disabled={historyIndex === 0}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button size="sm" onClick={handleSaveChanges}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Container Tree */}
        <div className="w-64 border-r bg-muted/30 p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4" />
            <h3 className="font-semibold text-sm">Page Structure</h3>
          </div>
          
          {currentContainers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>No containers yet.</p>
              <p className="mt-2">Add your first container to start building.</p>
            </div>
          ) : (
            <ContainerTree 
              containers={currentContainers}
              selectedId={selectedContainerId}
              onSelect={setSelectedContainerId}
              onDragStart={setDraggedContainerId}
              onDragEnd={() => setDraggedContainerId(null)}
            />
          )}
        </div>

        {/* Center - Visual Canvas */}
        <div className="flex-1 bg-muted/10 overflow-auto">
          <div 
            ref={canvasRef}
            className="min-h-full p-8"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedContainerId(null)
              }
            }}
          >
            <div className="max-w-7xl mx-auto bg-background rounded-lg shadow-sm min-h-[600px] p-4">
              {currentContainers.length === 0 ? (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                  <div className="text-center">
                    <Square className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No containers yet. Click &quot;Add Container&quot; to start building.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentContainers.map((container) => (
                    <CanvasContainer
                      key={container.id}
                      container={container}
                      isSelected={selectedContainerId === container.id}
                      onSelect={setSelectedContainerId}
                      draggedContainerId={draggedContainerId}
                      pageId={pageId}
                      onUpdate={updateContainerLocally}
                      onCreateChild={() => handleCreateContainer(container.id)}
                      onDelete={deleteContainerLocally}
                      selectedContainerId={selectedContainerId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Properties */}
        {selectedContainer && (
          <ContainerPropertiesPanel
            container={selectedContainer}
            pageId={pageId}
            onClose={() => setSelectedContainerId(null)}
            onUpdate={updateContainerLocally}
          />
        )}
      </div>
    </div>
  )
}

// Container Tree Component
interface ContainerTreeProps {
  containers: ContainerWithChildren[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  level?: number
}

function ContainerTree({ 
  containers, 
  selectedId, 
  onSelect, 
  onDragStart,
  onDragEnd,
  level = 0 
}: ContainerTreeProps) {
  return (
    <div className="space-y-1">
      {containers.map((container) => (
        <div key={container.id}>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-sm",
              "hover:bg-accent transition-colors",
              selectedId === container.id && "bg-accent"
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => onSelect(container.id)}
            draggable
            onDragStart={() => onDragStart(container.id)}
            onDragEnd={onDragEnd}
          >
            {container.layout_type === 'grid' ? (
              <Grid3X3 className="h-3 w-3" />
            ) : (
              <Columns className="h-3 w-3" />
            )}
            <span className="flex-1">
              {container.layout_type === 'grid' 
                ? `Grid (${container.grid_columns} cols)` 
                : `Flex (${container.flex_direction})`
              }
            </span>
          </div>
          
          {container.containers && container.containers.length > 0 && (
            <ContainerTree
              containers={container.containers}
              selectedId={selectedId}
              onSelect={onSelect}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  )
}