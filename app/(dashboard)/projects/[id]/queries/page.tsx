'use client'

import { useProjectContext } from '@/app/providers/project-provider'
import { UserRole } from '@/types/project'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function QueriesPage() {
  const router = useRouter()
  const { currentProject } = useProjectContext()

  useEffect(() => {
    if (currentProject && currentProject.user_role === UserRole.Default) {
      router.push(`/projects/${currentProject.id}`)
    }
  }, [currentProject, router])

  if (!currentProject || currentProject.user_role === UserRole.Default) {
    return null
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Queries</h1>
      <p className="text-muted-foreground">Query builder for {currentProject.name}</p>
    </div>
  )
}