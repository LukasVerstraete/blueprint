'use client'

import { useProjectContext } from '@/app/providers/project-provider'
import { useDeletePage } from '@/hooks/use-pages'
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
import { toast } from 'sonner'
import { Page, PageWithChildren } from '@/types/page'

interface DeletePageDialogProps {
  page: Page | PageWithChildren
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeletePageDialog({ page, open, onOpenChange }: DeletePageDialogProps) {
  const { currentProject } = useProjectContext()
  const deletePage = useDeletePage(currentProject?.id || '')

  const handleDelete = async () => {
    try {
      await deletePage.mutateAsync(page.id)
      toast.success('Page deleted successfully')
      onOpenChange(false)
    } catch {
      // Error is already handled in the hook
    }
  }

  // Check if page has children
  const hasChildren = 'children' in page && page.children && page.children.length > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Page</AlertDialogTitle>
          <AlertDialogDescription>
            {hasChildren ? (
              <>
                This page has subpages. You must delete or move all subpages before deleting this page.
              </>
            ) : (
              <>
                Are you sure you want to delete &quot;{page.name}&quot;? This will also delete all containers and components within this page. This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {!hasChildren && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletePage.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePage.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}