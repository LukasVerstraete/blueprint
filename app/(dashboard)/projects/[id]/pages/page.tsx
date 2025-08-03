'use client'

import { useProjectContext } from '@/app/providers/project-provider'
import { UserRole } from '@/types/project'
import { usePages } from '@/hooks/use-pages'
import { CreatePageDialog } from '@/components/page-builder/create-page-dialog'
import { PageTree } from '@/components/page-builder/page-tree'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function PagesPage() {
  const { currentProject } = useProjectContext()
  const { data: pages, isLoading } = usePages(currentProject?.id || '')

  if (!currentProject) {
    return null
  }

  const canEdit = currentProject.user_role === UserRole.Administrator || 
                  currentProject.user_role === UserRole.ContentManager

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading pages...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pages</h1>
          <p className="text-muted-foreground">
            {canEdit 
              ? 'Build and manage pages for your application'
              : 'Browse available pages in your application'
            }
          </p>
        </div>
        {canEdit && <CreatePageDialog />}
      </div>

      {pages && pages.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Page Hierarchy</CardTitle>
            <CardDescription>
              Click on a page to edit its layout and components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PageTree pages={pages} />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No pages yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              {canEdit 
                ? 'Get started by creating your first page'
                : 'No pages have been created yet'
              }
            </p>
            {canEdit && <CreatePageDialog />}
          </CardContent>
        </Card>
      )}
    </div>
  )
}