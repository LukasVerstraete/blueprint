'use client'

import { useState, useEffect } from 'react'
import { ComponentConfigDialogProps, getConfigObject } from '../types'
import { usePageBuilderContext } from '../../page-builder-context'
import { useEntities } from '@/hooks/use-entities'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'

type LabelType = 'static' | 'entity' | 'property' | 'query'

export function LabelConfigDialog({
  open,
  onOpenChange,
  component,
  projectId,
  pageId,
  containerId
}: ComponentConfigDialogProps) {
  const { onUpdateComponentConfig } = usePageBuilderContext()
  const { data: entities } = useEntities(projectId)
  const { data: queries } = useQueries(projectId)
  
  // Get current config
  const currentConfig = getConfigObject(component)
  
  // Form state
  const [type, setType] = useState<LabelType>((currentConfig.type as LabelType) || 'static')
  const [text, setText] = useState(currentConfig.text || '')
  const [entityId, setEntityId] = useState(currentConfig.entityId || '')
  const [entityInstanceId, setEntityInstanceId] = useState(currentConfig.entityInstanceId || '')
  const [propertyId, setPropertyId] = useState(currentConfig.propertyId || '')
  const [queryId, setQueryId] = useState(currentConfig.queryId || '')
  
  // Selected entity for property selection
  const selectedEntity = entities?.find(e => e.id === entityId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const config = [
      { key: 'type', value: type }
    ]
    
    switch (type) {
      case 'static':
        config.push({ key: 'text', value: text })
        break
      case 'entity':
        config.push({ key: 'entityId', value: entityId })
        config.push({ key: 'entityInstanceId', value: entityInstanceId })
        break
      case 'property':
        config.push({ key: 'entityId', value: entityId })
        config.push({ key: 'propertyId', value: propertyId })
        config.push({ key: 'entityInstanceId', value: entityInstanceId })
        break
      case 'query':
        config.push({ key: 'queryId', value: queryId })
        break
    }
    
    // Update locally instead of persisting immediately
    onUpdateComponentConfig?.(component.id, config)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Configure Label</DialogTitle>
            <DialogDescription>
              Choose what content to display in this label component.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Display Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as LabelType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Static Text</SelectItem>
                  <SelectItem value="entity">Entity Display String</SelectItem>
                  <SelectItem value="property">Property Value</SelectItem>
                  <SelectItem value="query">Query Result</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === 'static' && (
              <div className="grid gap-2">
                <Label htmlFor="text">Text Content</Label>
                <Textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter the text to display..."
                  rows={3}
                />
              </div>
            )}

            {(type === 'entity' || type === 'property') && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="entity">Entity</Label>
                  <Select value={entityId} onValueChange={setEntityId}>
                    <SelectTrigger id="entity">
                      <SelectValue placeholder="Select an entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {entities?.map(entity => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {type === 'property' && selectedEntity && (
                  <div className="grid gap-2">
                    <Label htmlFor="property">Property</Label>
                    <Select value={propertyId} onValueChange={setPropertyId}>
                      <SelectTrigger id="property">
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedEntity.properties?.map(property => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="entityInstance">Entity Instance ID</Label>
                  <Input
                    id="entityInstance"
                    value={entityInstanceId}
                    onChange={(e) => setEntityInstanceId(e.target.value)}
                    placeholder="e.g., param:id or a fixed ID"
                  />
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription>
                      Use <code>param:paramName</code> to reference a page parameter
                    </AlertDescription>
                  </Alert>
                </div>
              </>
            )}

            {type === 'query' && (
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
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    Only queries that return a single result are supported
                  </AlertDescription>
                </Alert>
              </div>
            )}
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