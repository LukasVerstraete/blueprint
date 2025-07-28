'use client'

import { useProjectContext } from '@/app/providers/project-provider'
import { UserRole } from '@/types/project'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function EntitiesPage() {
  const router = useRouter()
  const { currentProject } = useProjectContext()

  useEffect(() => {
    if (currentProject && currentProject.user_role !== UserRole.Administrator) {
      router.push(`/projects/${currentProject.id}`)
    }
  }, [currentProject, router])

  if (!currentProject || currentProject.user_role !== UserRole.Administrator) {
    return null
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Entities</h1>
      <p className="text-muted-foreground">Entity management for {currentProject.name}</p>
    </div>
  )
}