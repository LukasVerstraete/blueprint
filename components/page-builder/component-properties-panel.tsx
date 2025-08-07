'use client'

import { ComponentWithConfig, ComponentConfigInput } from '@/types/page'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoIcon, X } from 'lucide-react'
import { useEntitiesWithProperties } from '@/hooks/use-entities'
import { useQueries } from '@/hooks/use-queries'
import { useState, useEffect } from 'react'
import { getConfigValue } from './components/types'
import { cn } from '@/lib/utils'

interface ComponentPropertiesPanelProps {
  component: ComponentWithConfig | null
  projectId: string
  onUpdate: (componentId: string, config: ComponentConfigInput[]) => void
  onUpdateFormProperties?: (componentId: string, properties: any[]) => void
  onUpdateTableColumns?: (componentId: string, columns: any[]) => void
  onClose: () => void
  localConfigUpdates?: ComponentConfigInput[]
  formPropertiesUpdates?: any[]
  tableColumnsUpdates?: any[]
}

export function ComponentPropertiesPanel({
  component,
  projectId,
  onUpdate,
  onUpdateFormProperties,
  onUpdateTableColumns,
  onClose,
  localConfigUpdates,
  formPropertiesUpdates,
  tableColumnsUpdates
}: ComponentPropertiesPanelProps) {
  const { data: entities } = useEntitiesWithProperties(projectId)
  const { data: queries } = useQueries(projectId)
  
  // Get current config (merge saved with local updates)
  const getConfigVal = (key: string, defaultVal?: string) => {
    return getConfigValue(component!, key, defaultVal, localConfigUpdates)
  }

  if (!component) {
    return null
  }

  const renderLabelConfig = () => {
    const type = getConfigVal('type', 'static') || 'static'
    const text = getConfigVal('text', '') || ''
    const entityId = getConfigVal('entityId', '') || ''
    const entityInstanceId = getConfigVal('entityInstanceId', '') || ''
    const propertyId = getConfigVal('propertyId', '') || ''
    const queryId = getConfigVal('queryId', '') || ''

    const selectedEntity = entities?.find(e => e.id === entityId)

    const updateConfig = (updates: Partial<Record<string, string>>) => {
      const currentConfig: ComponentConfigInput[] = [
        { key: 'type', value: type },
        { key: 'text', value: text },
        { key: 'entityId', value: entityId },
        { key: 'entityInstanceId', value: entityInstanceId },
        { key: 'propertyId', value: propertyId },
        { key: 'queryId', value: queryId },
        ...Object.entries(updates).map(([key, value]) => ({ key, value }))
      ]
      
      // Remove duplicates, keeping the last occurrence
      const configMap = new Map<string, string>()
      currentConfig.forEach(item => configMap.set(item.key, item.value))
      
      onUpdate(component.id, Array.from(configMap.entries()).map(([key, value]) => ({ key, value })))
    }

    return (
      <>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Display Type</Label>
            <Select value={type} onValueChange={(value) => updateConfig({ type: value })}>
              <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Text</Label>
              <Textarea
                value={text}
                onChange={(e) => updateConfig({ text: e.target.value })}
                placeholder="Enter the text to display"
                rows={3}
              />
            </div>
          )}

          {(type === 'entity' || type === 'property') && (
            <>
              <div className="space-y-2">
                <Label>Entity</Label>
                <Select value={entityId} onValueChange={(value) => updateConfig({ entityId: value, propertyId: '' })}>
                  <SelectTrigger>
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
                <div className="space-y-2">
                  <Label>Property</Label>
                  <Select value={propertyId} onValueChange={(value) => updateConfig({ propertyId: value })}>
                    <SelectTrigger>
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

              <div className="space-y-2">
                <Label>Entity Instance ID</Label>
                <Input
                  value={entityInstanceId}
                  onChange={(e) => updateConfig({ entityInstanceId: e.target.value })}
                  placeholder="e.g., param:id or a fixed ID"
                />
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Use <code>param:paramName</code> to reference a page parameter.
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}

          {type === 'query' && (
            <div className="space-y-2">
              <Label>Query</Label>
              <Select value={queryId} onValueChange={(value) => updateConfig({ queryId: value })}>
                <SelectTrigger>
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
          )}
        </div>
      </>
    )
  }

  const renderPropertyConfig = () => {
    const entityId = getConfigVal('entityId', '') || ''
    const propertyId = getConfigVal('propertyId', '') || ''
    const entityInstanceId = getConfigVal('entityInstanceId', '') || ''
    
    const selectedEntity = entities?.find(e => e.id === entityId)

    const updateConfig = (updates: Partial<Record<string, string>>) => {
      const currentConfig: ComponentConfigInput[] = [
        { key: 'entityId', value: entityId },
        { key: 'propertyId', value: propertyId },
        { key: 'entityInstanceId', value: entityInstanceId },
        ...Object.entries(updates).map(([key, value]) => ({ key, value }))
      ]
      
      // Remove duplicates
      const configMap = new Map<string, string>()
      currentConfig.forEach(item => configMap.set(item.key, item.value))
      
      onUpdate(component.id, Array.from(configMap.entries()).map(([key, value]) => ({ key, value })))
    }

    return (
      <>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Entity</Label>
            <Select value={entityId} onValueChange={(value) => updateConfig({ entityId: value, propertyId: '' })}>
              <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Property</Label>
              <Select value={propertyId} onValueChange={(value) => updateConfig({ propertyId: value })}>
                <SelectTrigger>
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

          <div className="space-y-2">
            <Label>Entity Instance ID</Label>
            <Input
              value={entityInstanceId}
              onChange={(e) => updateConfig({ entityInstanceId: e.target.value })}
              placeholder="e.g., param:id or a fixed ID"
            />
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Use <code>param:paramName</code> to reference a page parameter.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </>
    )
  }

  const renderListConfig = () => {
    const queryId = getConfigVal('queryId', '') || ''
    const pageSize = getConfigVal('pageSize', '50') || '50'
    const emptyMessage = getConfigVal('emptyMessage', 'No items to display') || 'No items to display'

    const updateConfig = (updates: Partial<Record<string, string>>) => {
      const currentConfig: ComponentConfigInput[] = [
        { key: 'queryId', value: queryId },
        { key: 'pageSize', value: pageSize },
        { key: 'emptyMessage', value: emptyMessage },
        ...Object.entries(updates).map(([key, value]) => ({ key, value }))
      ]
      
      const configMap = new Map<string, string>()
      currentConfig.forEach(item => configMap.set(item.key, item.value))
      
      onUpdate(component.id, Array.from(configMap.entries()).map(([key, value]) => ({ key, value })))
    }

    return (
      <>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Query</Label>
            <Select value={queryId} onValueChange={(value) => updateConfig({ queryId: value })}>
              <SelectTrigger>
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
        </div>

        {/* Display Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Display Options</h4>
          
          <div className="space-y-2">
            <Label>Page Size</Label>
            <Input
              type="number"
              value={pageSize}
              onChange={(e) => updateConfig({ pageSize: e.target.value })}
              min="1"
              max="100"
            />
          </div>

          <div className="space-y-2">
            <Label>Empty Message</Label>
            <Input
              value={emptyMessage}
              onChange={(e) => updateConfig({ emptyMessage: e.target.value })}
              placeholder="Message when no data"
            />
          </div>
        </div>
      </>
    )
  }

  const renderTableConfig = () => {
    const queryId = getConfigVal('queryId', '') || ''
    const pageSize = getConfigVal('pageSize', '50') || '50'
    
    const query = queries?.find(q => q.id === queryId)
    const entity = entities?.find(e => e.id === query?.entity_id)
    const columns = tableColumnsUpdates || component.table_columns || []

    const updateConfig = (updates: Partial<Record<string, string>>) => {
      const currentConfig: ComponentConfigInput[] = [
        { key: 'queryId', value: queryId },
        { key: 'pageSize', value: pageSize },
        ...Object.entries(updates).map(([key, value]) => ({ key, value }))
      ]
      
      const configMap = new Map<string, string>()
      currentConfig.forEach(item => configMap.set(item.key, item.value))
      
      onUpdate(component.id, Array.from(configMap.entries()).map(([key, value]) => ({ key, value })))
    }

    const updateColumns = (newColumns: any[]) => {
      onUpdateTableColumns?.(component.id, newColumns)
    }

    const toggleColumn = (propertyId: string) => {
      const existingColumn = columns.find((c: any) => c.property_id === propertyId)
      
      if (existingColumn) {
        updateColumns(columns.filter((c: any) => c.property_id !== propertyId))
      } else {
        updateColumns([
          ...columns,
          {
            property_id: propertyId,
            visible: true,
            sort_order: columns.length
          }
        ])
      }
    }

    return (
      <>
        {/* Data Source */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Data Source</h4>
          <div className="space-y-2">
            <Label>Query</Label>
            <Select value={queryId} onValueChange={(value) => updateConfig({ queryId: value })}>
              <SelectTrigger>
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
        </div>

        {/* Display Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Display Options</h4>
          
          <div className="space-y-2">
            <Label>Page Size</Label>
            <Input
              type="number"
              value={pageSize}
              onChange={(e) => updateConfig({ pageSize: e.target.value })}
              min="1"
              max="100"
            />
          </div>

          {entity && (
            <div className="space-y-2">
              <Label>Visible Columns</Label>
              <div className="space-y-1 border rounded-lg p-2">
                {entity.properties?.map(property => {
                  const isSelected = columns.some((c: any) => c.property_id === property.id)
                  return (
                    <div
                      key={property.id}
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-accent",
                        isSelected && "bg-accent"
                      )}
                      onClick={() => toggleColumn(property.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="pointer-events-none"
                      />
                      <span className="text-sm">{property.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </>
    )
  }

  const renderFormConfig = () => {
    const formType = getConfigVal('formType', 'create') || 'create'
    const entityId = getConfigVal('entityId', '') || ''
    const queryId = getConfigVal('queryId', '') || ''
    const columns = getConfigVal('columns', '1') || '1'
    const submitButtonText = getConfigVal('submitButtonText', formType === 'create' ? 'Create' : 'Update')
    
    const entity = entities?.find(e => e.id === entityId)
    const formProperties = formPropertiesUpdates || component.form_properties || []

    const updateConfig = (updates: Partial<Record<string, string>>) => {
      const currentConfig: ComponentConfigInput[] = [
        { key: 'formType', value: formType },
        { key: 'entityId', value: entityId },
        { key: 'queryId', value: queryId },
        { key: 'columns', value: columns },
        { key: 'submitButtonText', value: submitButtonText },
        ...Object.entries(updates).map(([key, value]) => ({ key, value }))
      ]
      
      const configMap = new Map<string, string>()
      currentConfig.forEach(item => configMap.set(item.key, item.value))
      
      onUpdate(component.id, Array.from(configMap.entries()).map(([key, value]) => ({ key, value })))
    }

    const updateFormProperties = (newProperties: any[]) => {
      onUpdateFormProperties?.(component.id, newProperties)
    }

    const toggleProperty = (propertyId: string) => {
      const existingProp = formProperties.find((p: any) => p.property_id === propertyId)
      
      if (existingProp) {
        updateFormProperties(formProperties.filter((p: any) => p.property_id !== propertyId))
      } else {
        updateFormProperties([
          ...formProperties,
          {
            property_id: propertyId,
            visible: true,
            sort_order: formProperties.length
          }
        ])
      }
    }

    return (
      <>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Form Type</Label>
            <Select value={formType} onValueChange={(value) => updateConfig({ formType: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Entity</Label>
            <Select value={entityId} onValueChange={(value) => updateConfig({ entityId: value })}>
              <SelectTrigger>
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
        </div>

        {/* Data Source */}
        {formType === 'update' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Data Source</h4>
            
            <div className="space-y-2">
              <Label>Query (for fetching instance)</Label>
              <Select value={queryId} onValueChange={(value) => updateConfig({ queryId: value })}>
                <SelectTrigger>
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
          </div>
        )}

        {/* Layout */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Layout</h4>
          
          <div className="space-y-2">
            <Label>Number of Columns</Label>
            <Select value={columns} onValueChange={(value) => updateConfig({ columns: value })}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label>Submit Button Text</Label>
            <Input
              value={submitButtonText}
              onChange={(e) => updateConfig({ submitButtonText: e.target.value })}
              placeholder="Button text"
            />
          </div>
        </div>

        {/* Visible Properties */}
        {entity && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Visible Properties</h4>
            
            <div className="space-y-2">
              <div className="space-y-1 border rounded-lg p-2 max-h-64 overflow-y-auto">
                {entity.properties?.map(property => {
                  const isSelected = formProperties.some((p: any) => p.property_id === property.id)
                  const isRequired = property.is_required && formType === 'create'
                  
                  return (
                    <div
                      key={property.id}
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-accent",
                        isSelected && "bg-accent",
                        isRequired && "cursor-not-allowed opacity-75"
                      )}
                      onClick={() => !isRequired && toggleProperty(property.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected || isRequired}
                        onChange={() => {}}
                        disabled={isRequired}
                        className="pointer-events-none"
                      />
                      <span className="text-sm flex-1">{property.name}</span>
                      {isRequired && (
                        <span className="text-xs text-muted-foreground">Required</span>
                      )}
                    </div>
                  )
                })}
              </div>
              {formType === 'create' && (
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Required properties cannot be hidden in create forms.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}
      </>
    )
  }

  // Main render
  return (
    <div className="w-80 border-l bg-background overflow-y-auto">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">
          {component.component_type.charAt(0).toUpperCase() + component.component_type.slice(1)} Component
        </h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {component.component_type === 'label' && renderLabelConfig()}
        {component.component_type === 'property' && renderPropertyConfig()}
        {component.component_type === 'list' && renderListConfig()}
        {component.component_type === 'table' && renderTableConfig()}
        {component.component_type === 'form' && renderFormConfig()}
      </div>
    </div>
  )
}