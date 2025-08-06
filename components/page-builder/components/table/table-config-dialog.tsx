'use client'

import { useState, useEffect } from 'react'
import { ComponentConfigDialogProps, getConfigObject } from '../types'
import { usePageBuilderContext } from '../../page-builder-context'
import { useQueries } from '@/hooks/use-queries'
import { useEntity } from '@/hooks/use-entities'
import { TableColumnsManager } from './table-columns-manager'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function TableConfigDialog({
  open,
  onOpenChange,
  component,
  projectId,
  pageId,
  containerId
}: ComponentConfigDialogProps) {
  const { onUpdateComponentConfig, onUpdateTableColumns } = usePageBuilderContext()
  const { data: queries } = useQueries(projectId)
  
  // Get current config
  const currentConfig = getConfigObject(component)
  
  // Form state
  const [queryId, setQueryId] = useState(currentConfig.queryId || '')
  const [pageSize, setPageSize] = useState(currentConfig.pageSize || '50')
  const [pendingColumns, setPendingColumns] = useState<any[]>([])
  
  // Get selected query to find entity
  const selectedQuery = queries?.find(q => q.id === queryId)
  
  // Fetch entity for the selected query
  const { data: entity } = useEntity(
    projectId,
    selectedQuery?.entity_id || '',
    { enabled: !!selectedQuery?.entity_id }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Update component config
    const config = [
      { key: 'queryId', value: queryId },
      { key: 'pageSize', value: pageSize }
    ]
    
    // Update locally instead of persisting immediately
    onUpdateComponentConfig?.(component.id, config)
    
    // Update table columns if changed
    if (pendingColumns.length > 0) {
      onUpdateTableColumns?.(component.id, pendingColumns)
    }
    
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Configure Table</DialogTitle>
            <DialogDescription>
              Select a query and configure which columns to display.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="columns" disabled={!entity}>Columns</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="query">Query</Label>
                <Select value={queryId} onValueChange={setQueryId}>
                  <SelectTrigger id="query">
                    <SelectValue placeholder="Select a query" />
                  </SelectTrigger>
                  <SelectContent>
                    {queries?.map(query => (
                      <SelectItem key={query.id} value={query.id}>
                        {query.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pageSize">Page Size</Label>
                <Select value={pageSize} onValueChange={setPageSize}>
                  <SelectTrigger id="pageSize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 rows</SelectItem>
                    <SelectItem value="25">25 rows</SelectItem>
                    <SelectItem value="50">50 rows</SelectItem>
                    <SelectItem value="100">100 rows</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <TabsContent value="columns">
              {entity && (
                <TableColumnsManager
                  properties={entity.properties || []}
                  columns={component.table_columns || []}
                  onChange={setPendingColumns}
                />
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}