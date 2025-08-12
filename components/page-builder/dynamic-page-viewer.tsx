'use client'

import { Container } from '@/types/page-builder'
import { DynamicContainer } from './dynamic-container'

interface DynamicPageViewerProps {
  pageId: string
  pageName: string
  containers: Container[]
  projectId: string
  urlParameters: Record<string, any>
}

export function DynamicPageViewer({
  pageId,
  pageName,
  containers,
  projectId,
  urlParameters
}: DynamicPageViewerProps) {
  // Filter root-level containers
  const rootContainers = containers.filter(c => !c.parent_container_id)
  
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{pageName}</h1>
      
      {rootContainers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          This page has no content yet.
        </div>
      ) : (
        <div className="space-y-4">
          {rootContainers
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(container => (
              <DynamicContainer
                key={container.id}
                container={container}
                containers={containers}
                projectId={projectId}
                urlParameters={urlParameters}
              />
            ))}
        </div>
      )}
    </div>
  )
}