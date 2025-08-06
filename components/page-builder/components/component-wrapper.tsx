'use client'

import { useState } from 'react'
import { ComponentWithConfig } from '@/types/page'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { 
  MoreHorizontal, 
  Settings, 
  Trash2
} from 'lucide-react'
import { DraggableComponent } from '../draggable-component'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ComponentWrapperProps {
  component: ComponentWithConfig
  isPreview: boolean
  isSelected: boolean
  onSelect: () => void
  onConfigure: () => void
  onDelete?: () => void
  children: React.ReactNode
  projectId: string
  pageId: string
  containerId: string
}

export function ComponentWrapper({
  component,
  isPreview,
  isSelected,
  onSelect,
  onConfigure,
  onDelete,
  children,
  projectId: _projectId,
  pageId: _pageId,
  containerId: _containerId
}: ComponentWrapperProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = () => {
    onDelete?.()
    setShowDeleteDialog(false)
  }

  if (isPreview) {
    return <>{children}</>
  }

  return (
    <DraggableComponent id={component.id} isPreview={isPreview}>
      <div
        className={cn(
          "relative group border rounded-lg transition-all cursor-pointer",
          isSelected 
            ? "border-primary ring-2 ring-primary/20" 
            : "border-transparent hover:border-border"
        )}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        {/* Component Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                variant="secondary"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onConfigure()}>
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Component Type Badge */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-muted px-2 py-1 rounded text-xs font-medium">
            {component.component_type}
          </div>
        </div>

        {/* Component Content */}
        <div className="p-4">
          {children}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Component</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {component.component_type} component? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DraggableComponent>
  )
}