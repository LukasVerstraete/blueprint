'use client'

import { useState, useEffect } from 'react'
import { BaseComponentProps } from '../types'
import { TableRenderer } from './table-renderer'
import { TableConfigDialog } from './table-config-dialog'

export function TableComponent(props: BaseComponentProps) {
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
      <TableRenderer {...props} />
      
      <TableConfigDialog
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