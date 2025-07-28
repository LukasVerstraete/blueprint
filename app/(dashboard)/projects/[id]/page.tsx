'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectContext } from '@/app/providers/project-provider'
import { UserRole } from '@/types/project'

export default function ProjectPage() {
  const router = useRouter()
  const { currentProject } = useProjectContext()

  useEffect(() => {
    if (!currentProject) return

    switch (currentProject.user_role) {
      case UserRole.Administrator:
        router.replace(`/projects/${currentProject.id}/entities`)
        break
      case UserRole.ContentManager:
      case UserRole.Default:
        router.replace(`/projects/${currentProject.id}/pages`)
        break
    }
  }, [currentProject, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}