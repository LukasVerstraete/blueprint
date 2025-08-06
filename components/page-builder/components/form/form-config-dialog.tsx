'use client'

import { useState, useEffect } from 'react'
import { ComponentConfigDialogProps, getConfigObject } from '../types'
import { usePageBuilderContext } from '../../page-builder-context'
import { useEntities } from '@/hooks/use-entities'
import { useQueries } from '@/hooks/use-queries'
import { useEntity } from '@/hooks/use-entities'
import { FormPropertiesManager } from './form-properties-manager'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'

export function FormConfigDialog({
  open,
  onOpenChange,
  component,
  projectId,
  pageId: _pageId,
  containerId: _containerId
}: ComponentConfigDialogProps) {
  const { onUpdateComponentConfig, onUpdateFormProperties } = usePageBuilderContext()
  const { data: entities } = useEntities(projectId)
  const { data: queries } = useQueries(projectId)
  
  // Get current config
  const currentConfig = getConfigObject(component)
  
  // Form state
  const [formType, setFormType] = useState<'create' | 'update'>(
    (currentConfig.formType as 'create' | 'update') || 'create'
  )
  const [entityId, setEntityId] = useState(currentConfig.entityId || '')
  const [queryId, setQueryId] = useState(currentConfig.queryId || '')
  const [columns, setColumns] = useState(currentConfig.columns || '1')
  const [submitButtonText, setSubmitButtonText] = useState(
    currentConfig.submitButtonText || (formType === 'create' ? 'Create' : 'Update')
  )
  const [pendingProperties, setPendingProperties] = useState<any[]>([])
  
  // Get entity for property management
  const { data: entity } = useEntity(
    projectId,
    entityId || '',
    { enabled: !!entityId }
  )
  
  // Filter queries to only show those for the selected entity
  const entityQueries = queries?.filter(q => q.entity_id === entityId) || []

  // Update submit button text when form type changes
  useEffect(() => {
    if (!currentConfig.submitButtonText) {
      setSubmitButtonText(formType === 'create' ? 'Create' : 'Update')
    }
  }, [formType, currentConfig.submitButtonText])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Update component config
    const config = [
      { key: 'formType', value: formType },
      { key: 'entityId', value: entityId },
      { key: 'columns', value: columns },
      { key: 'submitButtonText', value: submitButtonText }
    ]
    
    if (formType === 'update') {
      config.push({ key: 'queryId', value: queryId })
    }
    
    // Update locally instead of persisting immediately
    onUpdateComponentConfig?.(component.id, config)
    
    // Update form properties if changed
    if (pendingProperties.length > 0) {
      onUpdateFormProperties?.(component.id, pendingProperties)
    }
    
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Configure Form</DialogTitle>
            <DialogDescription>
              Set up your form for creating or updating data.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="fields" disabled={!entity}>Fields</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="formType">Form Type</Label>
                <Select value={formType} onValueChange={(value: 'create' | 'update') => setFormType(value)}>
                  <SelectTrigger id="formType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create">Create New</SelectItem>
                    <SelectItem value="update">Update Existing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

              {formType === 'update' && entityId && (
                <div className="grid gap-2">
                  <Label htmlFor="query">Query (for update form)</Label>
                  <Select value={queryId} onValueChange={setQueryId}>
                    <SelectTrigger id="query">
                      <SelectValue placeholder="Select a query" />
                    </SelectTrigger>
                    <SelectContent>
                      {entityQueries.map(query => (
                        <SelectItem key={query.id} value={query.id}>
                          {query.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription>
                      The query should return a single instance to update
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="columns">Number of Columns</Label>
                <Select value={columns} onValueChange={setColumns}>
                  <SelectTrigger id="columns">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Column</SelectItem>
                    <SelectItem value="2">2 Columns</SelectItem>
                    <SelectItem value="3">3 Columns</SelectItem>
                    <SelectItem value="4">4 Columns</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="submitButton">Submit Button Text</Label>
                <Input
                  id="submitButton"
                  value={submitButtonText}
                  onChange={(e) => setSubmitButtonText(e.target.value)}
                  placeholder={formType === 'create' ? 'Create' : 'Update'}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="fields">
              {entity && (
                <FormPropertiesManager
                  properties={entity.properties || []}
                  formProperties={component.form_properties || []}
                  formType={formType}
                  onChange={setPendingProperties}
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