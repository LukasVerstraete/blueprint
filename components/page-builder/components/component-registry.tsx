import { ComponentType } from '@/types/page'
import dynamic from 'next/dynamic'

// Lazy load components for better performance
const LabelComponent = dynamic(() => 
  import('./label/label-component').then(mod => mod.LabelComponent),
  { loading: () => <ComponentPlaceholder type="label" /> }
)

const PropertyComponent = dynamic(() => 
  import('./property/property-component').then(mod => mod.PropertyComponent),
  { loading: () => <ComponentPlaceholder type="property" /> }
)

const ListComponent = dynamic(() => 
  import('./list/list-component').then(mod => mod.ListComponent),
  { loading: () => <ComponentPlaceholder type="list" /> }
)

const TableComponent = dynamic(() => 
  import('./table/table-component').then(mod => mod.TableComponent),
  { loading: () => <ComponentPlaceholder type="table" /> }
)

const FormComponent = dynamic(() => 
  import('./form/form-component').then(mod => mod.FormComponent),
  { loading: () => <ComponentPlaceholder type="form" /> }
)

// Loading placeholder while components load
function ComponentPlaceholder({ type }: { type: string }) {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-muted rounded w-32 mb-2"></div>
      <div className="text-xs text-muted-foreground">Loading {type} component...</div>
    </div>
  )
}

// Registry mapping component types to their implementations
export const componentRegistry = {
  [ComponentType.Label]: LabelComponent,
  [ComponentType.Property]: PropertyComponent,
  [ComponentType.List]: ListComponent,
  [ComponentType.Table]: TableComponent,
  [ComponentType.Form]: FormComponent,
}

// Helper to get component by type
export function getComponentByType(type: ComponentType) {
  return componentRegistry[type] || null
}