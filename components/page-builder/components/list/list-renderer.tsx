'use client'

import { useState } from 'react'
import { BaseComponentProps, getConfigValue } from '../types'
import { useQueryExecution } from '@/hooks/use-query-execution'
import { useQuery } from '@/hooks/use-queries'
import { useEntity } from '@/hooks/use-entities'
import { resolveDisplayString } from '@/lib/display-string-utils'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ListRenderer({ 
  component, 
  pageParameters = {}, 
  projectId,
  isPreview
}: BaseComponentProps) {
  const [page, setPage] = useState(1)
  
  // Get configuration
  const queryId = getConfigValue(component, 'queryId')
  const pageSize = parseInt(getConfigValue(component, 'pageSize', '50') || '50')
  const emptyMessage = getConfigValue(component, 'emptyMessage', 'No items to display')
  
  // Fetch query details
  const { data: query } = useQuery(projectId, queryId || '')
  
  // Fetch entity details for display string
  const { data: entity } = useEntity(
    projectId,
    query?.entity_id || '',
    { enabled: !!query?.entity_id }
  )
  
  // Execute query
  const { data: queryResult, isLoading, error } = useQueryExecution(
    projectId,
    queryId || '',
    { 
      page,
      pageSize,
      enabled: !!queryId 
    }
  )

  const totalPages = queryResult ? Math.ceil(queryResult.total / pageSize) : 0

  if (!queryId) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        No query selected
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-destructive p-4 text-center">
        Error loading data: {(error as Error).message}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!queryResult || queryResult.instances.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-8 text-center">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {queryResult.instances.map((instance) => {
          const displayString = entity?.display_string 
            ? resolveDisplayString(entity.display_string, instance.properties)
            : instance.id
          
          return (
            <div
              key={instance.id}
              className={cn(
                "p-3 rounded-lg border bg-card text-card-foreground",
                isPreview && "hover:bg-accent transition-colors cursor-pointer"
              )}
            >
              <div className="text-sm">
                {displayString}
              </div>
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}