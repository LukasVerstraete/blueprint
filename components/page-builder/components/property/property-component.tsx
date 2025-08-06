'use client'

import { useState, useEffect } from 'react'
import { BaseComponentProps } from '../types'
import { PropertyRenderer } from './property-renderer'
import { PropertyConfigDialog } from './property-config-dialog'

export function PropertyComponent(props: BaseComponentProps) {
  const [configOpen, setConfigOpen] = useState(false)

  useEffect(() => {
    if (props.shouldOpenConfig) {
      setConfigOpen(true)
    }
  }, [props.shouldOpenConfig])

  const handleConfigClose = (open: boolean) => {
    setConfigOpen(open)
    if (!open) {
      props.onConfigClose?.()
    }
  }

  return (
    <>
      <PropertyRenderer {...props} />
      
      <PropertyConfigDialog
        open={configOpen}
        onOpenChange={handleConfigClose}
        component={props.component}
        projectId={props.projectId}
        pageId={props.pageId}
        containerId={props.containerId}
      />
    </>
  )
}