'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectContext } from '@/app/providers/project-provider'
import { PageWithChildren } from '@/types/page'
import { EditPageDialog } from './edit-page-dialog'
import { DeletePageDialog } from './delete-page-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  FileText,
  FolderOpen,
  Folder
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageTreeProps {
  pages: PageWithChildren[]
  level?: number
}

export function PageTree({ pages, level = 0 }: PageTreeProps) {
  const router = useRouter()
  const { currentProject } = useProjectContext()
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set())
  const [editingPage, setEditingPage] = useState<PageWithChildren | null>(null)
  const [deletingPage, setDeletingPage] = useState<PageWithChildren | null>(null)

  const toggleExpanded = (pageId: string) => {
    const newExpanded = new Set(expandedPages)
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId)
    } else {
      newExpanded.add(pageId)
    }
    setExpandedPages(newExpanded)
  }

  const handlePageClick = (page: PageWithChildren) => {
    router.push(`/projects/${currentProject?.id}/pages/${page.id}`)
  }

  return (
    <>
      <div className="space-y-1">
        {pages.map((page) => {
          const hasChildren = page.children && page.children.length > 0
          const isExpanded = expandedPages.has(page.id)

          return (
            <div key={page.id}>
              <div
                className={cn(
                  "flex items-center gap-1 group rounded-md px-2 py-1.5 hover:bg-accent",
                  "cursor-pointer"
                )}
                style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
                onClick={() => handlePageClick(page)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (hasChildren) {
                      toggleExpanded(page.id)
                    }
                  }}
                  disabled={!hasChildren}
                >
                  {hasChildren ? (
                    isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )
                  ) : (
                    <div className="h-3 w-3" />
                  )}
                </Button>

                <div 
                  className="flex items-center gap-2 flex-1"
                >
                  {hasChildren ? (
                    isExpanded ? (
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    )
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">{page.name}</span>
                  {page.parameters && page.parameters.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({page.parameters.length} param{page.parameters.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handlePageClick(page)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Page
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingPage(page)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeletingPage(page)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {hasChildren && isExpanded && (
                <PageTree pages={page.children!} level={level + 1} />
              )}
            </div>
          )
        })}
      </div>

      {editingPage && (
        <EditPageDialog
          page={editingPage}
          open={true}
          onOpenChange={(open) => !open && setEditingPage(null)}
        />
      )}

      {deletingPage && (
        <DeletePageDialog
          page={deletingPage}
          open={true}
          onOpenChange={(open) => !open && setDeletingPage(null)}
        />
      )}
    </>
  )
}