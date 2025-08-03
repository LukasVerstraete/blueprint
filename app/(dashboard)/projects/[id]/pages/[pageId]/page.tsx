'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectContext } from '@/app/providers/project-provider'
import { UserRole } from '@/types/project'
import { usePage } from '@/hooks/use-pages'
import { useContainers } from '@/hooks/use-containers'
import { VisualPageEditor } from '@/components/page-builder/visual-page-editor'

export default function PageEditorPage({
  params
}: {
  params: Promise<{ id: string; pageId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { currentProject } = useProjectContext()
  const { data: page, isLoading: pageLoading } = usePage(resolvedParams.id, resolvedParams.pageId)
  const { data: containers, isLoading: containersLoading, refetch } = useContainers(
    resolvedParams.id, 
    resolvedParams.pageId
  )

  if (!currentProject) {
    return null
  }

  const canEdit = currentProject.user_role === UserRole.Administrator || 
                  currentProject.user_role === UserRole.ContentManager

  if (!canEdit) {
    router.push(`/projects/${currentProject.id}/pages`)
    return null
  }

  if (pageLoading || containersLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading page...</p>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Page not found</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <VisualPageEditor 
        pageId={resolvedParams.pageId} 
        containers={containers || []}
        onRefresh={() => refetch()}
        pageTitle={page.name}
        projectId={currentProject.id}
      />
    </div>
  )
}