import { ComponentWithConfig, ComponentConfigInput } from '@/types/page'

export interface BaseComponentProps {
  component: ComponentWithConfig
  pageParameters?: Record<string, any>
  isPreview?: boolean
  projectId: string
  pageId: string
  containerId: string
  shouldOpenConfig?: boolean
  onConfigClose?: () => void
  localConfigUpdates?: ComponentConfigInput[]
}

export interface ComponentConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  component: ComponentWithConfig
  projectId: string
  pageId: string
  containerId: string
}

// Helper to get config value
export function getConfigValue(
  component: ComponentWithConfig, 
  key: string,
  defaultValue?: string,
  localUpdates?: ComponentConfigInput[]
): string | undefined {
  // First check local updates if provided
  if (localUpdates) {
    const localItem = localUpdates.find(c => c.key === key)
    if (localItem) return localItem.value
  }
  
  // Then check saved config
  const config = component.config?.find(c => c.key === key)
  return config?.value || defaultValue
}

// Helper to get multiple config values as object
export function getConfigObject(
  component: ComponentWithConfig,
  localUpdates?: ComponentConfigInput[]
): Record<string, string> {
  const configObj: Record<string, string> = {}
  
  // Start with saved config
  component.config?.forEach(c => {
    configObj[c.key] = c.value
  })
  
  // Override with local updates if provided
  if (localUpdates) {
    localUpdates.forEach(item => {
      configObj[item.key] = item.value
    })
  }
  
  return configObj
}