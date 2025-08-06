'use client'

import { useState, useEffect } from 'react'
import { BaseComponentProps } from '../types'
import { ListRenderer } from './list-renderer'
import { ListConfigDialog } from './list-config-dialog'

export function ListComponent(props: BaseComponentProps) {
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
      <ListRenderer {...props} />
      
      <ListConfigDialog
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