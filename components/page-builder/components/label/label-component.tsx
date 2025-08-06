'use client'

import { useState, useEffect } from 'react'
import { BaseComponentProps } from '../types'
import { LabelRenderer } from './label-renderer'
import { LabelConfigDialog } from './label-config-dialog'

export function LabelComponent(props: BaseComponentProps) {
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
      <LabelRenderer {...props} />
      
      <LabelConfigDialog
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