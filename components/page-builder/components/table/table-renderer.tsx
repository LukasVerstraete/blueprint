'use client'

import { useState } from 'react'
import { BaseComponentProps, getConfigValue } from '../types'
import { useQueryExecution } from '@/hooks/use-query-execution'
import { useQuery } from '@/hooks/use-queries'
import { useEntity } from '@/hooks/use-entities'
import { formatDisplayValue } from '@/lib/entity-instance-utils'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { resolveDisplayString } from '@/lib/display-string-utils'

export function TableRenderer({ 
  component, 
  pageParameters = {}, 
  projectId,
  isPreview
}: BaseComponentProps) {
  const [page, setPage] = useState(1)
  
  // Get configuration
  const queryId = getConfigValue(component, 'queryId')
  const pageSize = parseInt(getConfigValue(component, 'pageSize', '50') || '50')
  
  // Fetch query details
  const { data: query } = useQuery(projectId, queryId || '')
  
  // Fetch entity details for properties
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

  // Get visible columns from table_columns configuration
  const visibleColumns = component.table_columns
    ?.filter(col => col.visible)
    ?.sort((a, b) => a.sort_order - b.sort_order) || []

  // Map column configs to properties
  const columnProperties = visibleColumns
    .map(col => entity?.properties?.find(p => p.id === col.property_id))
    .filter(Boolean)

  const totalPages = queryResult ? Math.ceil(queryResult.total / pageSize) : 0

  if (!queryId) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
        No query selected
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-destructive p-4 text-center border rounded-lg">
        Error loading data: {(error as Error).message}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-10 bg-muted rounded"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!queryResult || queryResult.instances.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-8 text-center border rounded-lg">
        No data to display
      </div>
    )
  }

  // If no columns configured, show all properties
  const displayColumns = columnProperties.length > 0 
    ? columnProperties 
    : entity?.properties || []

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {entity?.display_string && (
                <TableHead>{entity.name}</TableHead>
              )}
              {displayColumns.map((property) => (
                <TableHead key={property!.id}>
                  {property!.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {queryResult.instances.map((instance) => (
              <TableRow key={instance.id}>
                {entity?.display_string && (
                  <TableCell className="font-medium">
                    {resolveDisplayString(entity.display_string, instance.properties)}
                  </TableCell>
                )}
                {displayColumns.map((property) => {
                  const value = instance.properties[property!.property_name]
                  return (
                    <TableCell key={property!.id}>
                      {formatDisplayValue(value, property!.property_type)}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, queryResult.total)} of {queryResult.total} items
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}