'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Entity } from '@/types/entity'
import { EntityInstanceWithProperties } from '@/types/entity-instance'

interface DeleteEntityInstanceDialogProps {
  instance: EntityInstanceWithProperties | null
  entity: Entity
  onClose: () => void
  onConfirm: () => void
  open?: boolean
}

export function DeleteEntityInstanceDialog({
  instance,
  entity,
  onClose,
  onConfirm,
  open
}: DeleteEntityInstanceDialogProps) {
  const isOpen = open !== undefined ? open : !!instance
  
  if (!instance) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {entity.name} Instance</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{instance._displayString || 'this instance'}&quot;? 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}