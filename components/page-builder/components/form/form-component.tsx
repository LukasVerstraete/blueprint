'use client'

import { useState, useEffect } from 'react'
import { BaseComponentProps } from '../types'
import { FormRenderer } from './form-renderer'
import { FormConfigDialog } from './form-config-dialog'

export function FormComponent(props: BaseComponentProps) {
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
      <FormRenderer {...props} />
      
      <FormConfigDialog
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