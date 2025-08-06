'use client'

import { useState, useEffect } from 'react'
import { ContainerWithChildren, Container, LayoutType, FlexDirection, FlexJustify, FlexAlign, CreateContainerInput } from '@/types/page'
import { ContainerPropertiesPanel } from './container-properties-panel'
import { CanvasContainer } from './canvas-container'
import { PageSettingsDialog } from './page-settings-dialog'
import { PageBuilderProvider } from './page-builder-context'
import { UnifiedElementToolbar } from './unified-element-toolbar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
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
import {
  DndContext,
  DragOverlay,
  closestCenter,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  UniqueIdentifier,
  DragOverEvent,
  useDroppable,
  pointerWithin,
} from '@dnd-kit/core'
// import {
//   arrayMove,
//   SortableContext,
//   sortableKeyboardCoordinates,
//   verticalListSortingStrategy,
// } from '@dnd-kit/sortable'
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'

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
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
  const [localContainers, setLocalContainers] = useState(containers)
  const [history, setHistory] = useState<HistoryState[]>([{ containers }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [deletedContainerIds, setDeletedContainerIds] = useState<string[]>([])
  const [newContainerIds, setNewContainerIds] = useState<string[]>([])
  const [deletedComponentIds, setDeletedComponentIds] = useState<{ containerId: string, componentId: string }[]>([])
  const [newComponentIds, setNewComponentIds] = useState<{ containerId: string, componentId: string }[]>([])
  const [isPreview, setIsPreview] = useState(false)
  const [showPageSettings, setShowPageSettings] = useState(false)
  // const canvasRef = useRef<HTMLDivElement>(null)
  
  // Local state for component configurations
  const [componentConfigUpdates, setComponentConfigUpdates] = useState<Record<string, any>>({})
  const [formPropertiesUpdates, setFormPropertiesUpdates] = useState<Record<string, any>>({})
  const [tableColumnsUpdates, setTableColumnsUpdates] = useState<Record<string, any>>({})
  
  // Local state for page parameters
  const [pageParameterChanges, setPageParameterChanges] = useState<{
    created: any[]
    updated: Record<string, any>
    deleted: string[]
  }>({
    created: [],
    updated: {},
    deleted: []
  })
  
  // DnD Kit state
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null)
  
  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Update local containers when props change - but only if there are no unsaved changes
  useEffect(() => {
    // Check if there are any unsaved changes
    const hasUnsavedChanges = 
      deletedContainerIds.length > 0 ||
      newContainerIds.length > 0 ||
      deletedComponentIds.length > 0 ||
      newComponentIds.length > 0 ||
      Object.keys(componentConfigUpdates).length > 0 ||
      Object.keys(formPropertiesUpdates).length > 0 ||
      Object.keys(tableColumnsUpdates).length > 0 ||
      pageParameterChanges.created.length > 0 ||
      Object.keys(pageParameterChanges.updated).length > 0 ||
      pageParameterChanges.deleted.length > 0

    // Only sync if there are no unsaved changes
    if (!hasUnsavedChanges) {
      setLocalContainers(containers)
      // Only reset history if containers changed externally (not from undo/redo)
      const isFromHistory = history[historyIndex]?.containers === containers
      if (!isFromHistory) {
        setHistory([{ containers }])
        setHistoryIndex(0)
      }
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
    
    // Add container and all its children to deleted list (only if not new)
    const containerIdsToDelete = getAllChildIds(containerId)
    const existingContainerIds = containerIdsToDelete.filter(id => !newContainerIds.includes(id))
    setDeletedContainerIds(prev => [...prev, ...existingContainerIds])
    
    // Remove from new container list if it was a new container
    setNewContainerIds(prev => prev.filter(id => !containerIdsToDelete.includes(id)))
    
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

  // Add component locally
  const addComponentLocally = (containerId: string, componentType: string) => {
    // Generate temporary ID
    const tempId = `temp_component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newComponent = {
      id: tempId,
      container_id: containerId,
      component_type: componentType,
      config: getDefaultConfig(componentType),
      sort_order: 0,
      form_properties: [],
      table_columns: []
    }
    
    // Track as new component
    setNewComponentIds(prev => [...prev, { containerId, componentId: tempId }])
    
    // Add to container
    const addComponentToContainer = (items: ContainerWithChildren[]): ContainerWithChildren[] => {
      return items.map(item => {
        if (item.id === containerId) {
          return {
            ...item,
            components: [...(item.components || []), newComponent]
          }
        }
        if (item.containers) {
          return { ...item, containers: addComponentToContainer(item.containers) }
        }
        return item
      })
    }
    
    const newContainers = addComponentToContainer(localContainers)
    addToHistory(newContainers)
  }

  // Delete component locally
  const deleteComponentLocally = (containerId: string, componentId: string) => {
    // Track deletion (only if not new)
    const isNew = newComponentIds.some(nc => nc.componentId === componentId)
    if (!isNew) {
      setDeletedComponentIds(prev => [...prev, { containerId, componentId }])
    } else {
      // Remove from new components list
      setNewComponentIds(prev => prev.filter(nc => nc.componentId !== componentId))
    }
    
    // Remove from container
    const removeComponentFromContainer = (items: ContainerWithChildren[]): ContainerWithChildren[] => {
      return items.map(item => {
        if (item.id === containerId) {
          return {
            ...item,
            components: (item.components || []).filter(c => c.id !== componentId)
          }
        }
        if (item.containers) {
          return { ...item, containers: removeComponentFromContainer(item.containers) }
        }
        return item
      })
    }
    
    const newContainers = removeComponentFromContainer(localContainers)
    addToHistory(newContainers)
  }

  // Update component locally
  const updateComponentLocally = (containerId: string, componentId: string, updates: any) => {
    const updateComponentInContainer = (items: ContainerWithChildren[]): ContainerWithChildren[] => {
      return items.map(item => {
        if (item.id === containerId) {
          return {
            ...item,
            components: (item.components || []).map(c => 
              c.id === componentId ? { ...c, ...updates } : c
            )
          }
        }
        if (item.containers) {
          return { ...item, containers: updateComponentInContainer(item.containers) }
        }
        return item
      })
    }
    
    const newContainers = updateComponentInContainer(localContainers)
    addToHistory(newContainers)
  }

  // Update component config locally
  const updateComponentConfigLocally = (componentId: string, config: any[]) => {
    setComponentConfigUpdates(prev => ({
      ...prev,
      [componentId]: config
    }))
  }

  // Update form properties locally
  const updateFormPropertiesLocally = (componentId: string, properties: any[]) => {
    setFormPropertiesUpdates(prev => ({
      ...prev,
      [componentId]: properties
    }))
  }

  // Update table columns locally
  const updateTableColumnsLocally = (componentId: string, columns: any[]) => {
    setTableColumnsUpdates(prev => ({
      ...prev,
      [componentId]: columns
    }))
  }

  // Page parameter management functions
  const createPageParameterLocally = (parameter: any) => {
    setPageParameterChanges(prev => ({
      ...prev,
      created: [...prev.created, { ...parameter, id: `temp_param_${Date.now()}` }]
    }))
  }

  const updatePageParameterLocally = (parameterId: string, updates: any) => {
    setPageParameterChanges(prev => ({
      ...prev,
      updated: { ...prev.updated, [parameterId]: updates }
    }))
  }

  const deletePageParameterLocally = (parameterId: string) => {
    // If it's a temporary parameter, just remove it from created list
    const isTemp = parameterId.startsWith('temp_param_')
    if (isTemp) {
      setPageParameterChanges(prev => ({
        ...prev,
        created: prev.created.filter(p => p.id !== parameterId)
      }))
    } else {
      setPageParameterChanges(prev => ({
        ...prev,
        deleted: [...prev.deleted, parameterId]
      }))
    }
  }

  // Helper function to get default config for component type
  function getDefaultConfig(componentType: string): { key: string; value: string }[] {
    switch (componentType) {
      case 'label':
        return [
          { key: 'type', value: 'static' },
          { key: 'text', value: 'New Label' }
        ]
      case 'property':
        return [
          { key: 'entityId', value: '' },
          { key: 'propertyId', value: '' }
        ]
      case 'list':
        return [
          { key: 'queryId', value: '' }
        ]
      case 'table':
        return [
          { key: 'queryId', value: '' },
          { key: 'columns', value: '[]' }
        ]
      case 'form':
        return [
          { key: 'formType', value: 'create' },
          { key: 'entityId', value: '' },
          { key: 'columns', value: '1' }
        ]
      default:
        return []
    }
  }

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id)
  }

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      setActiveId(null)
      setOverId(null)
      return
    }

    const sourceId = active.id as string
    const targetId = over.id as string
    
    // Check if this is a component or container being dragged
    const draggedType = active.data?.current?.type
    
    // Check what type of element we're dropping over
    const targetType = over.data?.current?.type
    
    // If dropping over a container element (not another draggable), move into that container
    if (targetType === 'container') {
      // Prevent moving container into its descendant
      if (draggedType === 'container' && isDescendant(sourceId, targetId)) {
        toast.error("Cannot move a container into its own descendant")
        setActiveId(null)
        setOverId(null)
        return
      }
      
      moveElementToContainer(sourceId, targetId, draggedType)
    } else {
      // Otherwise, reorder within the same parent
      const newContainers = reorderWithinParent(localContainers, sourceId, targetId)
      addToHistory(newContainers)
    }
    
    setActiveId(null)
    setOverId(null)
  }

  // Move an element (container or component) to a different parent container
  const moveElementToContainer = (sourceId: string, targetContainerId: string, elementType: 'container' | 'component') => {
    let sourceElement: any = null
    let sourceParentId: string | null = null
    
    // Find source element and its parent
    const findSourceAndParent = (containers: ContainerWithChildren[], parentId: string | null = null): boolean => {
      for (const container of containers) {
        // Check containers
        if (elementType === 'container' && container.id === sourceId) {
          sourceElement = container
          sourceParentId = parentId
          return true
        }
        
        // Check components
        if (elementType === 'component' && container.components) {
          const component = container.components.find(c => c.id === sourceId)
          if (component) {
            sourceElement = component
            sourceParentId = container.id
            return true
          }
        }
        
        // Check nested containers
        if (container.containers) {
          const found = container.containers.find(c => c.id === sourceId)
          if (found && elementType === 'container') {
            sourceElement = found
            sourceParentId = container.id
            return true
          }
          
          // Recurse into children
          if (findSourceAndParent(container.containers, container.id)) {
            return true
          }
        }
      }
      return false
    }
    
    findSourceAndParent(localContainers)
    
    if (!sourceElement || sourceParentId === targetContainerId) {
      // No element found or already in target container
      return
    }
    
    // Remove element from its current parent
    const removeElement = (containers: ContainerWithChildren[]): ContainerWithChildren[] => {
      return containers.map(container => {
        const updatedContainer = { ...container }
        
        if (elementType === 'container' && container.containers) {
          const filteredContainers = container.containers.filter(c => c.id !== sourceId)
          if (filteredContainers.length < container.containers.length) {
            // Element was removed from this level, update sort orders
            updatedContainer.containers = filteredContainers
            updatedContainer.containers.forEach((c, idx) => {
              c.sort_order = idx
            })
            // Update component sort orders to come after containers
            if (updatedContainer.components) {
              updatedContainer.components.forEach((c, idx) => {
                c.sort_order = idx + updatedContainer.containers.length
              })
            }
          } else {
            // Recurse into nested containers
            updatedContainer.containers = removeElement(container.containers)
          }
        }
        
        if (elementType === 'component' && container.components) {
          const filteredComponents = container.components.filter(c => c.id !== sourceId)
          if (filteredComponents.length < container.components.length) {
            // Element was removed, update sort orders  
            updatedContainer.components = filteredComponents
            updatedContainer.components.forEach((c, idx) => {
              c.sort_order = idx + (updatedContainer.containers?.length || 0)
            })
          }
        }
        
        // Always recurse into containers if not already done
        if (elementType === 'container' && container.containers && updatedContainer.containers === container.containers) {
          updatedContainer.containers = removeElement(container.containers)
        }
        
        return updatedContainer
      })
    }
    
    // Add element to new parent
    const addElement = (containers: ContainerWithChildren[]): ContainerWithChildren[] => {
      return containers.map(container => {
        if (container.id === targetContainerId) {
          const updatedContainer = { ...container }
          
          if (elementType === 'container') {
            const newContainer = { ...sourceElement, parent_container_id: targetContainerId }
            const totalChildren = (updatedContainer.containers?.length || 0) + (updatedContainer.components?.length || 0)
            newContainer.sort_order = totalChildren
            updatedContainer.containers = [...(updatedContainer.containers || []), newContainer]
          } else {
            const newComponent = { ...sourceElement, container_id: targetContainerId }
            const totalChildren = (updatedContainer.containers?.length || 0) + (updatedContainer.components?.length || 0)
            newComponent.sort_order = totalChildren
            updatedContainer.components = [...(updatedContainer.components || []), newComponent]
          }
          
          return updatedContainer
        }
        
        if (container.containers) {
          return {
            ...container,
            containers: addElement(container.containers)
          }
        }
        
        return container
      })
    }
    
    let newContainers = removeElement(localContainers)
    newContainers = addElement(newContainers)
    addToHistory(newContainers)
  }
  
  // Reorder elements within the same parent
  const reorderWithinParent = (containers: ContainerWithChildren[], sourceId: string, targetId: string): ContainerWithChildren[] => {
    return containers.map(container => {
      // Create unified list of children
      const allChildren: Array<{ id: string; type: 'container' | 'component'; item: any }> = []
      
      // Add containers
      container.containers?.forEach(c => {
        allChildren.push({ id: c.id, type: 'container', item: c })
      })
      
      // Add components  
      container.components?.forEach(c => {
        allChildren.push({ id: c.id, type: 'component', item: c })
      })
      
      // Check if both source and target are in this container
      const sourceChild = allChildren.find(c => c.id === sourceId)
      const targetChild = allChildren.find(c => c.id === targetId)
      
      if (sourceChild && targetChild) {
        // Sort by current sort_order
        allChildren.sort((a, b) => (a.item.sort_order || 0) - (b.item.sort_order || 0))
        
        // Find indices
        const sourceIndex = allChildren.findIndex(c => c.id === sourceId)
        const targetIndex = allChildren.findIndex(c => c.id === targetId)
        
        if (sourceIndex !== -1 && targetIndex !== -1) {
          // Reorder
          const [movedItem] = allChildren.splice(sourceIndex, 1)
          allChildren.splice(targetIndex, 0, movedItem)
          
          // Update sort orders
          allChildren.forEach((child, idx) => {
            child.item.sort_order = idx
          })
          
          // Rebuild separated lists
          const newContainers: ContainerWithChildren[] = []
          const newComponents: any[] = []
          
          allChildren.forEach(child => {
            if (child.type === 'container') {
              newContainers.push(child.item)
            } else {
              newComponents.push(child.item)
            }
          })
          
          return {
            ...container,
            containers: newContainers,
            components: newComponents
          }
        }
      }
      
      // Recursively update children
      if (container.containers && container.containers.length > 0) {
        return {
          ...container,
          containers: reorderWithinParent(container.containers, sourceId, targetId)
        }
      }
      
      return container
    })
  }

  // Check if targetId is a descendant of sourceId
  const isDescendant = (sourceId: string, targetId: string): boolean => {
    const findInChildren = (container: ContainerWithChildren): boolean => {
      if (container.id === targetId) return true
      if (container.containers) {
        return container.containers.some(child => findInChildren(child))
      }
      return false
    }
    
    const sourceContainer = findContainerById(sourceId, localContainers)
    return sourceContainer ? findInChildren(sourceContainer) : false
  }

  // Move container to a new parent or reorder within same parent
  const moveContainer = (sourceId: string, targetId: string) => {
    let sourceContainer: ContainerWithChildren | null = null
    let _sourceParentId: string | null = null
    
    // Find source container and its parent
    const findSourceAndParent = (items: ContainerWithChildren[], parentId: string | null = null): void => {
      items.forEach(item => {
        if (item.id === sourceId) {
          sourceContainer = item
          _sourceParentId = parentId
        } else if (item.containers) {
          findSourceAndParent(item.containers, item.id)
        }
      })
    }
    
    findSourceAndParent(localContainers)
    
    if (!sourceContainer) return
    
    // Remove source from its current position
    const removeFromParent = (items: ContainerWithChildren[]): ContainerWithChildren[] => {
      return items.filter(item => {
        if (item.id === sourceId) return false
        if (item.containers) {
          item.containers = removeFromParent(item.containers)
        }
        return true
      })
    }
    
    // Add to new parent
    const addToNewParent = (items: ContainerWithChildren[]): ContainerWithChildren[] => {
      return items.map(item => {
        if (item.id === targetId) {
          return {
            ...item,
            containers: [...(item.containers || []), { ...sourceContainer!, parent_container_id: targetId }]
          }
        }
        if (item.containers) {
          return { ...item, containers: addToNewParent(item.containers) }
        }
        return item
      })
    }
    
    let newContainers = removeFromParent(localContainers)
    
    // If dropping at root level
    if (targetId === 'root') {
      newContainers = [...newContainers, { ...sourceContainer, parent_container_id: null }]
    } else {
      newContainers = addToNewParent(newContainers)
    }
    
    addToHistory(newContainers)
  }

  // Helper function to find a container by ID
  const findContainerById = (id: string, items: ContainerWithChildren[]): ContainerWithChildren | null => {
    for (const item of items) {
      if (item.id === id) return item
      if (item.containers) {
        const found = findContainerById(id, item.containers)
        if (found) return found
      }
    }
    return null
  }

  // Create new container with defaults
  const handleCreateContainer = async (parentContainerId: string | null = null) => {
    // Generate temporary ID
    const tempId = `temp_container_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // If no parent, add to root container (first container)
    const actualParentId = parentContainerId || localContainers[0]?.id
    
    // Calculate sort order based on parent's total children (containers + components)
    let sortOrder = 0
    if (actualParentId) {
      const parent = findContainerById(actualParentId, localContainers)
      if (parent) {
        const containerCount = parent.containers?.length || 0
        const componentCount = parent.components?.length || 0
        sortOrder = containerCount + componentCount
      }
    }
    
    const newContainerWithChildren: ContainerWithChildren = {
      id: tempId,
      page_id: pageId,
      parent_container_id: actualParentId,
      layout_type: LayoutType.Flex,
      flex_direction: FlexDirection.Column,
      flex_justify: FlexJustify.Start,
      flex_align: FlexAlign.Stretch,
      grid_columns: null,
      spacing: 16,
      padding: 16,
      background_color: null,
      width: null,
      height: null,
      min_height: '100px',
      sort_order: sortOrder,
      containers: [],
      components: []
    }
    
    // Track as new container
    setNewContainerIds(prev => [...prev, tempId])
    
    // Always add as child to a parent (root or specified)
    const addChildContainer = (items: ContainerWithChildren[]): ContainerWithChildren[] => {
      return items.map(item => {
        if (item.id === actualParentId) {
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
    
    // Select the new container
    setSelectedContainerId(tempId)
  }

  // Save all changes
  const handleSaveChanges = async () => {
    try {
      // Map of temporary IDs to real IDs
      const idMap: Record<string, string> = {}
      
      // Helper to get all containers in a flat list
      const getAllContainers = (items: ContainerWithChildren[]): ContainerWithChildren[] => {
        const result: ContainerWithChildren[] = []
        items.forEach(item => {
          result.push(item)
          if (item.containers) {
            result.push(...getAllContainers(item.containers))
          }
        })
        return result
      }
      
      const allContainers = getAllContainers(localContainers)
      
      // Step 1: Create new containers (depth-first to ensure parents are created first)
      const createNewContainers = async (containers: ContainerWithChildren[]): Promise<void> => {
        for (const container of containers) {
          if (newContainerIds.includes(container.id)) {
            // Map parent ID if it's a temp ID
            const parentId = container.parent_container_id && idMap[container.parent_container_id] 
              ? idMap[container.parent_container_id] 
              : container.parent_container_id
            
            const createInput: CreateContainerInput = {
              page_id: pageId,
              parent_container_id: parentId,
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
            }
            
            const result = await createContainerMutation.mutateAsync(createInput)
            idMap[container.id] = result.id
          }
          
          // Recursively create child containers
          if (container.containers) {
            await createNewContainers(container.containers)
          }
        }
      }
      
      await createNewContainers(localContainers)
      
      // Step 2: Create new components
      for (const { containerId, componentId } of newComponentIds) {
        const realContainerId = idMap[containerId] || containerId
        const container = allContainers.find(c => c.id === containerId)
        const component = container?.components?.find(c => c.id === componentId)
        
        if (component) {
          const response = await fetch(`/api/projects/${currentProject?.id}/pages/${pageId}/containers/${realContainerId}/components`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              component_type: component.component_type,
              config: component.config,
              sort_order: component.sort_order
            })
          })
          
          if (!response.ok) {
            console.error(`Failed to create component ${componentId}`)
          }
        }
      }
      
      // Step 3: Update existing containers (skip new ones)
      await Promise.all(
        allContainers
          .filter(container => !newContainerIds.includes(container.id))
          .map(async (container) => {
            // Map parent ID if it's a temp ID
            const parentId = container.parent_container_id && idMap[container.parent_container_id] 
              ? idMap[container.parent_container_id] 
              : container.parent_container_id
            
            const response = await fetch(`/api/projects/${currentProject?.id}/pages/${pageId}/containers/${container.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                parent_container_id: parentId,
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
      
      // Step 4: Update existing components
      for (const container of allContainers) {
        if (container.components) {
          for (const component of container.components) {
            // Skip new components
            if (newComponentIds.some(nc => nc.componentId === component.id)) continue
            
            const realContainerId = idMap[container.id] || container.id
            const response = await fetch(`/api/projects/${currentProject?.id}/pages/${pageId}/containers/${realContainerId}/components/${component.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                config: component.config,
                sort_order: component.sort_order
              })
            })
            
            if (!response.ok) {
              console.error(`Failed to update component ${component.id}`)
            }
          }
        }
      }
      
      // Step 5: Update component configurations
      for (const [componentId, config] of Object.entries(componentConfigUpdates)) {
        const component = allContainers.flatMap(c => c.components || []).find(comp => comp.id === componentId)
        if (component) {
          const containerId = allContainers.find(c => c.components?.some(comp => comp.id === componentId))?.id
          if (containerId) {
            const realContainerId = idMap[containerId] || containerId
            const response = await fetch(`/api/projects/${currentProject?.id}/pages/${pageId}/containers/${realContainerId}/components/${componentId}/config`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(config)
            })
            if (!response.ok) {
              console.error(`Failed to update config for component ${componentId}`)
            }
          }
        }
      }
      
      // Step 6: Update form properties
      for (const [componentId, properties] of Object.entries(formPropertiesUpdates)) {
        const component = allContainers.flatMap(c => c.components || []).find(comp => comp.id === componentId)
        if (component) {
          const containerId = allContainers.find(c => c.components?.some(comp => comp.id === componentId))?.id
          if (containerId) {
            const realContainerId = idMap[containerId] || containerId
            const response = await fetch(`/api/projects/${currentProject?.id}/pages/${pageId}/containers/${realContainerId}/components/${componentId}/form-properties`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(properties)
            })
            if (!response.ok) {
              console.error(`Failed to update form properties for component ${componentId}`)
            }
          }
        }
      }
      
      // Step 7: Update table columns
      for (const [componentId, columns] of Object.entries(tableColumnsUpdates)) {
        const component = allContainers.flatMap(c => c.components || []).find(comp => comp.id === componentId)
        if (component) {
          const containerId = allContainers.find(c => c.components?.some(comp => comp.id === componentId))?.id
          if (containerId) {
            const realContainerId = idMap[containerId] || containerId
            const response = await fetch(`/api/projects/${currentProject?.id}/pages/${pageId}/containers/${realContainerId}/components/${componentId}/table-columns`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(columns)
            })
            if (!response.ok) {
              console.error(`Failed to update table columns for component ${componentId}`)
            }
          }
        }
      }
      
      // Step 8: Handle page parameters
      // Create new parameters
      for (const param of pageParameterChanges.created) {
        const { id: _id, ...paramData } = param // Remove temp ID
        const response = await fetch(`/api/projects/${currentProject?.id}/pages/${pageId}/parameters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paramData)
        })
        if (!response.ok) {
          console.error(`Failed to create parameter ${param.name}`)
        }
      }
      
      // Update existing parameters
      for (const [parameterId, updates] of Object.entries(pageParameterChanges.updated)) {
        const response = await fetch(`/api/projects/${currentProject?.id}/pages/${pageId}/parameters/${parameterId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })
        if (!response.ok) {
          console.error(`Failed to update parameter ${parameterId}`)
        }
      }
      
      // Delete parameters
      for (const parameterId of pageParameterChanges.deleted) {
        const response = await fetch(`/api/projects/${currentProject?.id}/pages/${pageId}/parameters/${parameterId}`, {
          method: 'DELETE'
        })
        if (!response.ok) {
          console.error(`Failed to delete parameter ${parameterId}`)
        }
      }
      
      // Step 9: Delete removed components
      for (const { containerId, componentId } of deletedComponentIds) {
        const realContainerId = idMap[containerId] || containerId
        const response = await fetch(`/api/projects/${currentProject?.id}/pages/${pageId}/containers/${realContainerId}/components/${componentId}`, {
          method: 'DELETE'
        })
        if (!response.ok) {
          console.error(`Failed to delete component ${componentId}`)
        }
      }
      
      // Step 10: Delete removed containers
      for (const containerId of deletedContainerIds) {
        const response = await fetch(`/api/projects/${currentProject?.id}/pages/${pageId}/containers/${containerId}`, {
          method: 'DELETE'
        })
        if (!response.ok) {
          console.error(`Failed to delete container ${containerId}`)
        }
      }
      
      // Clear tracking lists after successful save
      setDeletedContainerIds([])
      setNewContainerIds([])
      setDeletedComponentIds([])
      setNewComponentIds([])
      setComponentConfigUpdates({})
      setFormPropertiesUpdates({})
      setTableColumnsUpdates({})
      setPageParameterChanges({ created: [], updated: {}, deleted: [] })
      
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

  // Context value for page builder
  const pageBuilderContextValue = {
    onUpdateComponentConfig: updateComponentConfigLocally,
    onUpdateFormProperties: updateFormPropertiesLocally,
    onUpdateTableColumns: updateTableColumnsLocally,
    componentConfigUpdates,
    formPropertiesUpdates,
    tableColumnsUpdates,
    onCreatePageParameter: createPageParameterLocally,
    onUpdatePageParameter: updatePageParameterLocally,
    onDeletePageParameter: deletePageParameterLocally,
    pageParameterChanges
  }

  return (
    <PageBuilderProvider value={pageBuilderContextValue}>
      <DndContext
        sensors={isPreview ? [] : sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
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
              <Button 
                variant={isPreview ? "default" : "outline"} 
                size="sm"
                onClick={() => setIsPreview(!isPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreview ? 'Exit Preview' : 'Preview'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPageSettings(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Page Settings
              </Button>
            </div>
          </div>
        </div>

      {/* Toolbar */}
      {!isPreview && (
        <div className="border-b px-4 py-2 flex items-center justify-between bg-background">
          <div className="flex items-center gap-2">
            <UnifiedElementToolbar 
              onSelect={(type) => {
                if (type === 'container') {
                  handleCreateContainer()
                } else {
                  // Add component to selected container or root container
                  const targetContainerId = selectedContainerId || localContainers[0]?.id
                  if (targetContainerId) {
                    addComponentLocally(targetContainerId, type)
                  }
                }
              }}
            />
            
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
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Container Tree */}
        {!isPreview && (
          <div className="w-64 border-r bg-muted/30 p-4 overflow-y-auto">
            <div 
              className={cn(
                "flex items-center gap-2 mb-4 px-2 py-1 rounded cursor-pointer",
                "hover:bg-accent transition-colors",
                selectedContainerId === currentContainers[0]?.id && "bg-accent"
              )}
              onClick={() => setSelectedContainerId(currentContainers[0]?.id || null)}
            >
              <Layers className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Page Structure</h3>
            </div>
            
            {currentContainers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>No elements yet.</p>
                <p className="mt-2">Add your first element to start building.</p>
              </div>
            ) : (
              <>
                {/* Only show children of root container, not the root itself */}
                {currentContainers[0]?.containers && currentContainers[0].containers.length > 0 && (
                  <ContainerTree 
                    containers={currentContainers[0].containers}
                    selectedId={selectedContainerId}
                    onSelect={setSelectedContainerId}
                    onDragStart={() => {}}
                    onDragEnd={() => {}}
                  />
                )}
                {/* Show components in the tree as well */}
                {currentContainers[0]?.components && currentContainers[0].components.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {currentContainers[0].components.map((component) => (
                      <div
                        key={component.id}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-sm",
                          "hover:bg-accent transition-colors text-muted-foreground"
                        )}
                      >
                        <span className="text-xs">•</span>
                        <span className="flex-1">{component.component_type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Center - Visual Canvas */}
        <div className="flex-1 bg-muted/10 overflow-auto">
          <DroppableCanvas
            onSelect={() => setSelectedContainerId(null)}
            isOver={overId === 'root' && activeId !== null}
          >
            <div className="h-full">
              {currentContainers.length === 0 ? (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                  <div className="text-center">
                    <Square className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No elements yet. Click &quot;Add Element&quot; to start building.
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
                      pageId={pageId}
                      onUpdate={updateContainerLocally}
                      onCreateChild={handleCreateContainer}
                      onDelete={deleteContainerLocally}
                      selectedContainerId={selectedContainerId}
                      activeId={activeId as string}
                      overId={overId as string}
                      isPreview={isPreview}
                      selectedComponentId={selectedComponentId}
                      onSelectComponent={setSelectedComponentId}
                      pageParameters={{}} // TODO: Get from URL params
                      onAddComponent={addComponentLocally}
                      onDeleteComponent={deleteComponentLocally}
                      onUpdateComponent={updateComponentLocally}
                      onUpdateComponentConfig={updateComponentConfigLocally}
                      onUpdateFormProperties={updateFormPropertiesLocally}
                      onUpdateTableColumns={updateTableColumnsLocally}
                      componentConfigUpdates={componentConfigUpdates}
                      formPropertiesUpdates={formPropertiesUpdates}
                      tableColumnsUpdates={tableColumnsUpdates}
                    />
                  ))}
                </div>
              )}
            </div>
          </DroppableCanvas>
        </div>

        {/* Right Panel - Properties */}
        {!isPreview && selectedContainer && (
          <ContainerPropertiesPanel
            container={selectedContainer}
            pageId={pageId}
            onClose={() => setSelectedContainerId(null)}
            onUpdate={updateContainerLocally}
          />
        )}
      </div>
    </div>
    
    {/* Drag Overlay */}
    <DragOverlay>
      {activeId ? (
        <DragOverlayContent containerId={activeId as string} containers={localContainers} />
      ) : null}
    </DragOverlay>
    
    {/* Page Settings Dialog */}
    <PageSettingsDialog
      pageId={pageId}
      open={showPageSettings}
      onOpenChange={setShowPageSettings}
      onCreate={createPageParameterLocally}
      onUpdate={updatePageParameterLocally}
      onDelete={deletePageParameterLocally}
      localParameters={pageParameterChanges}
    />
      </DndContext>
    </PageBuilderProvider>
  )
}

// Helper component for drag overlay
function DragOverlayContent({ containerId, containers }: { containerId: string; containers: ContainerWithChildren[] }) {
  const container = findContainerRecursive(containers, containerId)
  
  if (!container) return null
  
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

function findContainerRecursive(containers: ContainerWithChildren[], id: string): ContainerWithChildren | null {
  for (const container of containers) {
    if (container.id === id) return container
    if (container.containers) {
      const found = findContainerRecursive(container.containers, id)
      if (found) return found
    }
  }
  return null
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

// Droppable canvas component
function DroppableCanvas({ 
  children, 
  onSelect,
  isOver
}: { 
  children: React.ReactNode
  onSelect: () => void
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({
    id: 'root',
    data: {
      type: 'root'
    }
  })

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "h-full transition-colors",
        isOver && "bg-blue-50/20"
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSelect()
        }
      }}
    >
      {children}
    </div>
  )
}