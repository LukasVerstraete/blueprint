'use client'

import { useProjectContext } from '@/app/providers/project-provider'
import { UserRole } from '@/types/project'

export default function PagesPage() {
  const { currentProject } = useProjectContext()

  if (!currentProject) {
    return null
  }

  const canEdit = currentProject.user_role === UserRole.Administrator || 
                  currentProject.user_role === UserRole.ContentManager

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Pages</h1>
      <p className="text-muted-foreground">
        {canEdit 
          ? `Page builder for ${currentProject.name}`
          : `Available pages in ${currentProject.name}`
        }
      </p>
    </div>
  )
}