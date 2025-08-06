import { ComponentWithConfig } from '@/types/page'

export interface BaseComponentProps {
  component: ComponentWithConfig
  pageParameters?: Record<string, any>
  isPreview?: boolean
  projectId: string
  pageId: string
  containerId: string
  shouldOpenConfig?: boolean
  onConfigClose?: () => void
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
  defaultValue?: string
): string | undefined {
  const config = component.config?.find(c => c.key === key)
  return config?.value || defaultValue
}

// Helper to get multiple config values as object
export function getConfigObject(component: ComponentWithConfig): Record<string, string> {
  const configObj: Record<string, string> = {}
  component.config?.forEach(c => {
    configObj[c.key] = c.value
  })
  return configObj
}