'use client'

import { Container } from '@/types/page-builder'
import { useComponents } from '@/hooks/use-components'
import { DynamicComponent } from './dynamic-component'
import { cn } from '@/lib/utils'

interface DynamicContainerProps {
  container: Container
  containers: Container[]
  projectId: string
  urlParameters: Record<string, any>
}

export function DynamicContainer({
  container,
  containers,
  projectId,
  urlParameters
}: DynamicContainerProps) {
  const { data: components } = useComponents(container.id)
  
  // Find child containers
  const childContainers = containers.filter(
    c => c.parent_container_id === container.id
  )
  
  // Combine components and child containers, sorted by order
  const children = [
    ...(components || []).map(c => ({ type: 'component' as const, data: c })),
    ...childContainers.map(c => ({ type: 'container' as const, data: c }))
  ].sort((a, b) => a.data.sort_order - b.data.sort_order)
  
  // Build container styles
  const containerStyles: React.CSSProperties = {
    padding: container.padding ? `${container.padding}px` : undefined,
    backgroundColor: container.background_color || undefined,
    minHeight: container.min_height ? `${container.min_height}px` : undefined,
    height: container.height ? `${container.height}px` : undefined,
    width: container.width ? `${container.width}px` : undefined,
  }
  
  // Build layout classes
  const layoutClasses = cn(
    container.layout_type === 'grid' && 'grid',
    container.layout_type === 'grid' && container.grid_columns && 
      `grid-cols-${container.grid_columns}`,
    container.layout_type === 'flex' && 'flex',
    container.layout_type === 'flex' && container.flex_direction === 'column' && 
      'flex-col',
    container.layout_type === 'flex' && container.flex_direction === 'row' && 
      'flex-row',
    container.layout_type === 'flex' && container.flex_justify && 
      `justify-${container.flex_justify}`,
    container.layout_type === 'flex' && container.flex_align && 
      `items-${container.flex_align}`,
    container.spacing && `gap-${Math.round(container.spacing / 4)}`
  )
  
  return (
    <div style={containerStyles} className={layoutClasses}>
      {children.map((child) => {
        if (child.type === 'component') {
          return (
            <DynamicComponent
              key={child.data.id}
              component={child.data}
              projectId={projectId}
              urlParameters={urlParameters}
            />
          )
        } else {
          return (
            <DynamicContainer
              key={child.data.id}
              container={child.data}
              containers={containers}
              projectId={projectId}
              urlParameters={urlParameters}
            />
          )
        }
      })}
    </div>
  )
}