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

interface DeleteEntityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entity: Entity | null
  onConfirm: () => void
  isDeleting?: boolean
  impact?: {
    property_references: number
  }
}

export function DeleteEntityDialog({ 
  open, 
  onOpenChange, 
  entity, 
  onConfirm, 
  isDeleting,
  impact 
}: DeleteEntityDialogProps) {
  if (!entity) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Entity</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the entity &quot;{entity.name}&quot;? 
            This action cannot be undone.
            {impact && impact.property_references > 0 && (
              <span className="block mt-2 font-medium text-destructive">
                Warning: This entity is referenced by {impact.property_references} {impact.property_references === 1 ? 'property' : 'properties'}.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}