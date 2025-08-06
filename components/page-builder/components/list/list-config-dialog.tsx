'use client'

import { useState } from 'react'
import { ComponentConfigDialogProps, getConfigObject } from '../types'
import { usePageBuilderContext } from '../../page-builder-context'
import { useQueries } from '@/hooks/use-queries'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ListConfigDialog({
  open,
  onOpenChange,
  component,
  projectId,
  pageId,
  containerId
}: ComponentConfigDialogProps) {
  const { onUpdateComponentConfig } = usePageBuilderContext()
  const { data: queries } = useQueries(projectId)
  
  // Get current config
  const currentConfig = getConfigObject(component)
  
  // Form state
  const [queryId, setQueryId] = useState(currentConfig.queryId || '')
  const [pageSize, setPageSize] = useState(currentConfig.pageSize || '50')
  const [emptyMessage, setEmptyMessage] = useState(currentConfig.emptyMessage || 'No items to display')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const config = [
      { key: 'queryId', value: queryId },
      { key: 'pageSize', value: pageSize },
      { key: 'emptyMessage', value: emptyMessage }
    ]
    
    // Update locally instead of persisting immediately
    onUpdateComponentConfig?.(component.id, config)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Configure List</DialogTitle>
            <DialogDescription>
              Select a query to display its results as a list.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
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
                  <SelectItem value="10">10 items</SelectItem>
                  <SelectItem value="25">25 items</SelectItem>
                  <SelectItem value="50">50 items</SelectItem>
                  <SelectItem value="100">100 items</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="emptyMessage">Empty Message</Label>
              <Input
                id="emptyMessage"
                value={emptyMessage}
                onChange={(e) => setEmptyMessage(e.target.value)}
                placeholder="Message when no items found"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}