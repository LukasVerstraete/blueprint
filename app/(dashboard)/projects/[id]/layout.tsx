'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProjectContext } from '@/app/providers/project-provider'
import { createClient } from '@/utils/supabase/client'
import { ProjectWithRole, UserRole } from '@/types/project'

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const router = useRouter()
  const { currentProject, setCurrentProject, projects } = useProjectContext()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const projectId = params.id as string

  useEffect(() => {
    // Check if project is already loaded in context
    const existingProject = projects.find(p => p.id === projectId)
    if (existingProject) {
      setCurrentProject(existingProject)
      setLoading(false)
      return
    }

    // Load project if not in context
    async function loadProject() {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          user_project_roles!inner(role)
        `)
        .eq('id', projectId)
        .eq('user_project_roles.user_id', user.id)
        .single()

      if (projectError || !project) {
        setError('Project not found or access denied')
        setLoading(false)
        return
      }

      const projectWithRole: ProjectWithRole = {
        ...project,
        user_role: project.user_project_roles[0].role as UserRole
      }

      setCurrentProject(projectWithRole)
      setLoading(false)
    }

    loadProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projects])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => router.push('/projects')}
            className="text-primary hover:underline"
          >
            Back to projects
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}