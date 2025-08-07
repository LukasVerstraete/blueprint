'use client'

import { useState, useEffect } from 'react'
import { ComponentConfigDialogProps, getConfigObject } from '../types'
import { usePageBuilderContext } from '../../page-builder-context'
import { useEntitiesWithProperties } from '@/hooks/use-entities'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'

export function PropertyConfigDialog({
  open,
  onOpenChange,
  component,
  projectId,
  pageId,
  containerId
}: ComponentConfigDialogProps) {
  const { onUpdateComponentConfig } = usePageBuilderContext()
  const { data: entities } = useEntitiesWithProperties(projectId)
  
  // Get current config
  const currentConfig = getConfigObject(component)
  
  // Form state
  const [entityId, setEntityId] = useState(currentConfig.entityId || '')
  const [propertyId, setPropertyId] = useState(currentConfig.propertyId || '')
  const [entityInstanceId, setEntityInstanceId] = useState(currentConfig.entityInstanceId || '')
  
  // Selected entity for property selection
  const selectedEntity = entities?.find(e => e.id === entityId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const config = [
      { key: 'entityId', value: entityId },
      { key: 'propertyId', value: propertyId },
      { key: 'entityInstanceId', value: entityInstanceId }
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
            <DialogTitle>Configure Property</DialogTitle>
            <DialogDescription>
              Select which property to display and where to get the data from.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
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

            {selectedEntity && (
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
                  Use <code>param:paramName</code> to reference a page parameter. 
                  For example, <code>param:id</code> will use the ID from the URL.
                </AlertDescription>
              </Alert>
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