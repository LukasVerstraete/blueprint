'use client'

import { createContext, useContext } from 'react'

interface PageBuilderContextValue {
  // Component configuration updates
  onUpdateComponentConfig?: (componentId: string, config: any[]) => void
  onUpdateFormProperties?: (componentId: string, properties: any[]) => void
  onUpdateTableColumns?: (componentId: string, columns: any[]) => void
  
  // Get current local state
  componentConfigUpdates?: Record<string, any>
  formPropertiesUpdates?: Record<string, any>
  tableColumnsUpdates?: Record<string, any>
  
  // Page parameters
  onCreatePageParameter?: (parameter: any) => void
  onUpdatePageParameter?: (parameterId: string, updates: any) => void
  onDeletePageParameter?: (parameterId: string) => void
  pageParameterChanges?: {
    created: any[]
    updated: Record<string, any>
    deleted: string[]
  }
}

const PageBuilderContext = createContext<PageBuilderContextValue>({})

export function usePageBuilderContext() {
  return useContext(PageBuilderContext)
}

export const PageBuilderProvider = PageBuilderContext.Provider