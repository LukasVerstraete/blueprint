'use client'

import { Component } from '@/types/page-builder'
import { useComponentConfig } from '@/hooks/use-component-config'
import { LabelComponent } from './components/label/label-component'
import { PropertyComponent } from './components/property/property-component'
import { FormComponent } from './components/form/form-component'
import { ListComponent } from './components/list/list-component'
import { TableComponent } from './components/table/table-component'

interface DynamicComponentProps {
  component: Component
  projectId: string
  urlParameters: Record<string, any>
}

export function DynamicComponent({
  component,
  projectId,
  urlParameters
}: DynamicComponentProps) {
  const { data: config } = useComponentConfig(component.id)
  
  // Merge URL parameters into component config
  const configWithParams = {
    ...config,
    urlParameters,
    // Replace any config values that reference URL parameters
    entityInstanceId: urlParameters.entityInstanceId || config?.entityInstanceId,
  }
  
  switch (component.component_type) {
    case 'label':
      return (
        <LabelComponent
          componentId={component.id}
          projectId={projectId}
          config={configWithParams}
          isReadOnly={true}
        />
      )
      
    case 'property':
      return (
        <PropertyComponent
          componentId={component.id}
          projectId={projectId}
          config={configWithParams}
          isReadOnly={true}
        />
      )
      
    case 'form':
      return (
        <FormComponent
          componentId={component.id}
          projectId={projectId}
          config={configWithParams}
          isReadOnly={false} // Forms are interactive in app view
        />
      )
      
    case 'list':
      return (
        <ListComponent
          componentId={component.id}
          projectId={projectId}
          config={configWithParams}
          isReadOnly={true}
        />
      )
      
    case 'table':
      return (
        <TableComponent
          componentId={component.id}
          projectId={projectId}
          config={configWithParams}
          isReadOnly={true}
        />
      )
      
    default:
      return (
        <div className="p-4 border rounded bg-muted">
          Unknown component type: {component.component_type}
        </div>
      )
  }
}